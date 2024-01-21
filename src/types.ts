import type { StoreApi, StoreMutatorIdentifier, StateCreator } from 'zustand';

type onSave<TState> =
  | ((pastState: TState, currentState: TState) => void)
  | undefined;

type HandleSet<TState> = (
  pastState: Partial<TState>,
  currentState: Partial<TState>,
  deltaState?: Partial<TState> | null,
) => void;

export interface _TemporalState<TState> {
  pastStates: Partial<TState>[];
  futureStates: Partial<TState>[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  isTracking: boolean;
  pause: () => void;
  resume: () => void;

  setOnSave: (onSave: onSave<Partial<TState>>) => void;
  _onSave: onSave<Partial<TState>>;
  _handleSet: HandleSet<Partial<TState>>;
}

export interface ZundoOptions<TState, PartialTState = TState> {
  partialize?: (state: TState) => PartialTState;
  limit?: number;
  equality?: (pastState: PartialTState, currentState: PartialTState) => boolean;
  diff?: (
    pastState: Partial<PartialTState>,
    currentState: Partial<PartialTState>,
  ) => Partial<PartialTState> | null;
  onSave?: onSave<Partial<TState>>;
  handleSet?: (
    handleSet: HandleSet<TState>,
  ) => (
    pastState: TState,
    currentState: PartialTState,
    deltaState?: Partial<PartialTState> | null,
  ) => void;
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
