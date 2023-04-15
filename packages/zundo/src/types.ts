import type { StoreApi } from 'zustand';

type onSave<TState> =
  | ((pastState: TState, currentState: TState) => void)
  | undefined;

// Inspired by https://stackoverflow.com/a/66144780/9931154
type KeysWithoutValsOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? never : P]: P;
};

type ObjectWithoutFunctions<T> = {
  [P in KeysWithoutValsOfType<T, Function>]: P extends keyof T ? T[P] : never;
};

export interface TemporalStateWithInternals<TState> {
  pastStates: ObjectWithoutFunctions<TState>[];
  futureStates: ObjectWithoutFunctions<TState>[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  trackingStatus: 'paused' | 'tracking';
  pause: () => void;
  resume: () => void;

  setOnSave: (onSave: onSave<TState>) => void;
  __internal: {
    onSave: onSave<TState>;
    handleUserSet: (pastState: TState) => void;
  };
}

export interface ZundoOptions<TState, PartialTState = TState> {
  partialize?: (state: TState) => PartialTState;
  limit?: number;
  equality?: (currentState: TState, pastState: TState) => boolean;
  onSave?: onSave<TState>;
  handleSet?: (
    handleSet: StoreApi<TState>['setState'],
  ) => StoreApi<TState>['setState'];
  // Functions are not serializable, so we don't want to store them in the state
  pastStates?: ObjectWithoutFunctions<PartialTState>[];
  futureStates?: ObjectWithoutFunctions<PartialTState>[];
}

export type Write<T, U> = Omit<T, keyof U> & U;

export type TemporalState<TState> = Omit<
  TemporalStateWithInternals<TState>,
  '__internal'
>;

// https://stackoverflow.com/a/69328045/9931154
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
