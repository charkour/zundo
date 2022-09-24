import type { StoreApi } from 'zustand/vanilla';

type onSave<State> = (pastState: State, currentState: State) => void;

export interface TemporalStateWithInternals<TState> {
  pastStates: TState[];
  futureStates: TState[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  trackingState: 'paused' | 'tracking';
  pause: () => void;
  resume: () => void;

  setOnSave: (onSave: onSave<TState>) => void;
  __internal: {
    onSave: onSave<TState>;
    handleUserSet: (pastState: TState) => void;
  };
}

export interface ZundoOptions<State, TemporalState = State> {
  partialize?: (state: State) => TemporalState;
  limit?: number;
  equality?: (a: State, b: State) => boolean;
  /* called when saved */
  onSave?: onSave<State>;
  /* Middleware for the temporal setter */
  handleSet?: (
    handleSet: StoreApi<State>['setState'],
  ) => StoreApi<State>['setState'];
}

export type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never;

export type Write<T, U> = Omit<T, keyof U> & U;

export type TemporalState<TState> = Omit<
  TemporalStateWithInternals<TState>,
  '__internal'
>;
