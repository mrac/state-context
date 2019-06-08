import * as React from 'react';
import { Context, SFC } from "react";
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
    beforeSetState?: (log: {
        stateChange: Partial<TState>;
        oldState: TState;
        newState: TState;
        stack: string[];
        caller: string;
    }) => void;
    afterSetState?: (log: {
        stateChange: Partial<TState>;
        oldState: TState;
        newState: TState;
        stack: string[];
        caller: string;
    }) => void;
    newProviderValue?: (log: {
        stateChange: Partial<TState>;
        oldState: TState;
        newState: TState;
    }) => void;
}
declare type StateContextMiddlewares = StateContextMiddleware<Partial<{}>>[];
export declare function createStateContext<TState extends Partial<{}>>(initialState: TState, middlewares?: StateContextMiddlewares): React.Context<Store<TState>>;
export declare const StateContextProvider: SFC<StateProviderProps>;
export declare function useContextState<TState>(contextObject: Context<Store<TState>>): {
    [P in keyof TState]: [TState[P], (newValue: Partial<TState[P]>) => void];
};
export {};
