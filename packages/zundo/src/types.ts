import type { StoreApi, StoreMutatorIdentifier } from 'zustand';
import type { StateCreator } from 'zustand/vanilla';

type onSave<TState> =
  | ((pastState: TState, currentState: TState) => void)
  | undefined;

export interface TemporalStateWithInternals<TState> {
  pastStates: Partial<TState>[];
  futureStates: Partial<TState>[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  trackingStatus: 'paused' | 'tracking';
  pause: () => void;
  resume: () => void;

  setOnSave: (onSave: onSave<TState>) => void;
  __onSave: onSave<TState>;
  __handleSet: (pastState: TState) => void;
}

export interface ZundoOptions<TState, PartialTState = TState> {
  partialize?: (state: TState) => PartialTState;
  limit?: number;
  equality?: (currentState: TState, pastState: TState) => boolean;
  onSave?: onSave<TState>;
  handleSet?: (
    handleSet: StoreApi<TState>['setState'],
  ) => StoreApi<TState>['setState'];
  pastStates?: Partial<PartialTState>[];
  futureStates?: Partial<PartialTState>[];
  wrapTemporal?: (
    storeInitializer: StateCreator<
      TemporalStateWithInternals<TState>,
      [StoreMutatorIdentifier, unknown][],
      []
    >,
  ) => StateCreator<
    TemporalStateWithInternals<TState>,
    [StoreMutatorIdentifier, unknown][],
    [StoreMutatorIdentifier, unknown][]
  >;
}

export type Write<T, U> = Omit<T, keyof U> & U;

export type TemporalState<TState> = Omit<
  TemporalStateWithInternals<TState>,
  '__onSave' | '__handleUserSet'
>;
