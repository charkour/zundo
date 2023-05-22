import type { StoreApi, StoreMutatorIdentifier } from 'zustand';
import type { StateCreator } from 'zustand/vanilla';

type onSave<TState> =
  | ((pastState: TState, currentState: TState) => void)
  | undefined;

  // TemporalState with internal properties
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
  // Internal properties
  _onSave: onSave<TState>;
  _handleSet: (pastState: TState) => void;
  _userSet: StoreApi<TState>['setState'];
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
  /**
   * @deprecated Use `wrapTemporal` instead. wrapTemporal: (config) => (_set, get, api) => { const set: typeof _set = (state, replace) => { ... }; return config(set, get, api);
   */
  handleSet?: (
    handleSet: StoreApi<TState>['setState'],
  ) => StoreApi<TState>['setState'];
  pastStates?: Partial<PartialTState>[];
  futureStates?: Partial<PartialTState>[];
  wrapTemporal?: (
    config: StateCreator<
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
  '_onSave' | '_handleSet' | '_userSet'
>;
