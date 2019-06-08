import * as React from 'react';

interface Store<TState = Partial<{}>> {
    state: TState;
    setState: (newState: Partial<TState>) => void;
    useState: {
        [P in keyof TState]: [TState[P], (newValue: Partial<TState[P]>) => void];
    };
}

interface StateProviderProps {
    context: React.Context<Store<any>>;
}

export interface StateContextMiddleware<TState = Partial<{}>> {
    beforeSetState?: (log: { stateChange: Partial<TState>, oldState: TState, newState: TState, stack: string[], caller: string }) => void,
    afterSetState?: (log: { stateChange: Partial<TState>, oldState: TState, newState: TState, stack: string[], caller: string }) => void,
    newProviderValue?: (log: { stateChange: Partial<TState>, oldState: TState, newState: TState }) => void
}

type StateContextMiddlewareMethod = keyof StateContextMiddleware<Partial<{}>>;

type StateContextMiddlewares = StateContextMiddleware<Partial<{}>>[];

const middlewareMap = new Map<React.Context<Store<any>>, StateContextMiddlewares>();
const oldStateMap = new Map<React.Context<Store<any>>, Partial<{}>>();
const stateChangeMap = new Map<React.Context<Store<any>>, Partial<{}>>();

export function createStateContext<TState extends Partial<{}>>(initialState: TState, middlewares?: StateContextMiddlewares) {
    const contextObject = React.createContext<Store<TState>>({ state: initialState } as Store<TState>);
    middlewares && middlewareMap.set(contextObject, middlewares);
    return contextObject;
};

export const StateContextProvider: React.SFC<StateProviderProps> = props => {
    const context = props.context;
    const stateInitial = React.useContext(context).state;
    const [state, setState] = React.useState(stateInitial);
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
        const newState = { ...state, ...stateChange };

        const log = {
            stateChange,
            oldState: state,
            newState,
            stack: stack(new Error().stack),
            caller: caller((new Error()).stack)
        };

        runMiddlewares('beforeSetState', log);
        stateChangeMap.set(context, { ...stateChangeMap.get(context) || {}, ...stateChange });
        setState(newState);
        runMiddlewares('afterSetState', log);
    };

    const useState: any = {};

    Object.keys(state).forEach(stateKey => {
        let stateValue = state[stateKey];

        const setStateFn = (val: any) => {
            setStatePartial({
                [stateKey]: val
            });
        };

        useState[stateKey] = [stateValue, setStateFn];
    });

    const value = {
        state,
        setState: setStatePartial,
        useState
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

export function useContextState<TState>(contextObject: React.Context<Store<TState>>): {
    [P in keyof TState]: [TState[P], (newValue: Partial<TState[P]>) => void];
} {
    const context = React.useContext(contextObject);
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
