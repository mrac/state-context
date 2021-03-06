import * as React from 'react';

import {
    createContext,
    useContext,
    useState,
    Context,
    SFC
} from "react";

interface Store<TState = Partial<{}>> {
    state: TState;
    setState: (newState: Partial<TState>) => void;
    useState: {
        [P in keyof TState]: [TState[P], (newValue: Partial<TState[P]>) => void];
    };
}

interface StateProviderProps {
    context: Context<Store<any>>;
}

export interface StateContextMiddleware<TState = Partial<{}>> {
    beforeSetState?: (log: { stateChange: Partial<TState>, oldState: TState, newState: TState, stack: string[], caller: string }) => void,
    afterSetState?: (log: { stateChange: Partial<TState>, oldState: TState, newState: TState, stack: string[], caller: string }) => void,
    newProviderValue?: (log: { stateChange: Partial<TState>, oldState: TState, newState: TState }) => void
}

type StateContextMiddlewareMethod = keyof StateContextMiddleware<Partial<{}>>;

type StateContextMiddlewares = StateContextMiddleware<Partial<{}>>[];

const middlewareMap = new Map<Context<Store<any>>, StateContextMiddlewares>();
const oldStateMap = new Map<Context<Store<any>>, Partial<{}>>();
const stateChangeMap = new Map<Context<Store<any>>, Partial<{}>>();

export function createStateContext<TState extends Partial<{}>>(initialState: TState, middlewares?: StateContextMiddlewares) {
    const contextObject = createContext<Store<TState>>({ state: initialState } as Store<TState>);
    middlewares && middlewareMap.set(contextObject, middlewares);
    return contextObject;
};

export const StateContextProvider: SFC<StateProviderProps> = props => {
    const context = props.context;
    const stateInitial = useContext(context).state;
    const [state, setState] = useState(stateInitial);
    const middlewares = middlewareMap.has(context) ? middlewareMap.get(context) : [];

    const runMiddlewares = (method: StateContextMiddlewareMethod, log: any) => {
        middlewares.forEach(m => {
            const fn: Function = m[method];
            if (fn) {
                fn(log);
            }
        });
    };

    const setStatePartial = (stateChange: Partial<{}>) => {
        const oldAggregatedStateChange = stateChangeMap.get(context) || {};
        const aggregatedStateChange = { ...oldAggregatedStateChange, ...stateChange };
        const newState = { ...state, ...aggregatedStateChange };

        const log = {
            stateChange,
            oldState: { ...state, ...oldAggregatedStateChange },
            newState,
            stack: stack(new Error().stack),
            caller: caller((new Error()).stack)
        };

        stateChangeMap.set(context, aggregatedStateChange);

        runMiddlewares('beforeSetState', log);
        setState(newState);
        runMiddlewares('afterSetState', log);
    };

    const useStateFn: any = {};

    Object.keys(state).forEach(stateKey => {
        let stateValue = state[stateKey];

        const setStateFn = (val: any) => {
            setStatePartial({
                [stateKey]: val
            });
        };

        useStateFn[stateKey] = [stateValue, setStateFn];
    });

    const value = {
        state,
        setState: setStatePartial,
        useState: useStateFn
    };

    const oldState = oldStateMap.get(context);
    const stateChange = stateChangeMap.get(context);

    const log = {
        oldState,
        newState: state,
        stateChange
    };
    runMiddlewares('newProviderValue', log);

    oldStateMap.set(context, state);
    stateChangeMap.set(context, {});

    return (
        <props.context.Provider value={value}>
            {props.children}
        </props.context.Provider>
    );
};

export function useContextState<TState>(contextObject: Context<Store<TState>>): {
    [P in keyof TState]: [TState[P], (newValue: Partial<TState[P]>) => void];
} {
    const context = useContext(contextObject);
    const state: any = context.state;
    const setState = context.setState;
    const useObject: any = {};

    Object.keys(state).forEach(stateKey => {
        const stateValue = state[stateKey];
        const setStateFn = (val: any) => {
            setState({
                ...state,
                ...{ [stateKey]: val }
            });
        };
        useObject[stateKey] = [stateValue, setStateFn];
    });
    return useObject;
}

function stack(errorStack: string) {
    return errorStack
        .split('\n')
        .slice(1)
        .map(line => line.trim().replace(/^at */, ''));
}

function caller(errorStack: string) {
    const lines = errorStack.split('\n').slice(1);

    let prevFile: string;
    let prevLine: string;
    let theLine: string;

    const some = lines.some((line, index) => {
        line = line.trim();

        if (
            !line.startsWith('at setStatePartial')
            && !line.startsWith('at Object.setStatePartial')
            && !line.startsWith('at setStateFn')
            && !line.startsWith('at Object.setStateFn')
            && !line.match(/\(<anonymous>\)/)
        ) {
            const stackPath = (line.match(/\(([^)]+)\)/) || [])[1] || '';
            const stackFile = (stackPath.match(/\/([^:/]+):\d+:\d+$/) || [])[1];

            if (prevLine && stackFile && stackFile !== prevFile) {
                theLine = prevLine;
                return true;
            }

            prevFile = stackFile;
            prevLine = line;
        }
        return false;
    });

    if (!some) {
        theLine = prevLine;
    }

    let callerName = theLine.replace(/^ *at */, '');
    return callerName;
}
