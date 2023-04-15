import type {
  StateCreator,
  StoreMutatorIdentifier,
  Mutate,
  StoreApi,
} from 'zustand';
import { createVanillaTemporal } from './temporal';
import type { TemporalState, Write, ZundoOptions } from './types';

type Zundo = <
  TState,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  UState = TState,
>(
  config: StateCreator<TState, [...Mps, ['temporal', unknown]], Mcs>,
  options?: ZundoOptions<TState, UState>,
) => StateCreator<
  TState,
  Mps,
  [['temporal', StoreApi<TemporalState<UState>>], ...Mcs]
>;

declare module 'zustand/vanilla' {
  interface StoreMutators<S, A> {
    temporal: Write<S, { temporal: A }>;
  }
}

type ZundoImpl = <TState>(
  config: StateCreator<TState, [], []>,
  options: ZundoOptions<TState>,
) => StateCreator<TState, [], []>;

const zundoImpl: ZundoImpl = (config, baseOptions) => (set, get, _store) => {
  type TState = ReturnType<typeof config>;
  type StoreAddition = StoreApi<TemporalState<TState>>;

  const options = {
    partialize: (state: TState) => state,
    handleSet: (handleSetCb: typeof set) => handleSetCb,
    ...baseOptions,
  };
  const { partialize, handleSet: userlandSetFactory } = options;

  const temporalStore = createVanillaTemporal<TState>(set, get, options);

  const store = _store as Mutate<
    StoreApi<TState>,
    [['temporal', StoreAddition]]
  >;
  const { setState } = store;

  // TODO: should temporal be only temporalStore.getState()?
  // We can hide the rest of the store in the secret internals.
  store.temporal = temporalStore;

  const curriedUserLandSet = userlandSetFactory(
    temporalStore.getState().__internal.handleUserSet,
  );

  const modifiedSetState: typeof setState = (state, replace) => {
    const pastState = partialize(get());
    setState(state, replace);
    curriedUserLandSet(pastState);
  };
  store.setState = modifiedSetState;

  const modifiedSetter: typeof set = (state, replace) => {
    // Get most up to date state. Should this be the same as the state in the callback?
    const pastState = partialize(get());
    set(state, replace);
    curriedUserLandSet(pastState);
  };

  return config(modifiedSetter, get, _store);
};

export const temporal = zundoImpl as unknown as Zundo;
export type { ZundoOptions, Zundo, TemporalState };