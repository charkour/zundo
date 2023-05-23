import type { StoreApi, StoreMutatorIdentifier } from 'zustand';
import type { StateCreator } from 'zustand/vanilla';

type onSave<TState> =
  | ((pastState: TState, currentState: TState) => void)
  | undefined;

export interface _TemporalState<TState> {
  pastStates: Partial<TState>[];
  futureStates: Partial<TState>[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  trackingStatus: 'paused' | 'tracking';
  pause: () => void;
  resume: () => void;

  setOnSave: (onSave: onSave<TState>) => void;
  _onSave: onSave<TState>;
  _handleSet: (pastState: TState) => void;
}

export type TemporalStateCreator<TState> = StateCreator<
  _TemporalState<TState>,
  [],
  []
>;

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
      _TemporalState<TState>,
      [StoreMutatorIdentifier, unknown][],
      []
    >,
  ) => StateCreator<
    _TemporalState<TState>,
    [StoreMutatorIdentifier, unknown][],
    [StoreMutatorIdentifier, unknown][]
  >;
}

export type Write<T, U> = Omit<T, keyof U> & U;

export type TemporalState<TState> = Omit<
  _TemporalState<TState>,
  '_onSave' | '_handleSet'
>;
