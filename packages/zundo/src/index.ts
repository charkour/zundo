import {
  StateCreator,
  StoreMutatorIdentifier,
  Mutate,
  StoreApi,
} from 'zustand';
import {
  createTemporalStore,
  TemporalStateWithInternals,
  ZundoOptions,
} from './temporal';
export type { ZundoOptions } from './temporal';
export { createTemporalStore };
export type TemporalState<TState> = Omit<
  TemporalStateWithInternals<TState>,
  '__internal'
>;

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
  config: PopArgument<StateCreator<TState, [], []>>,
  options: ZundoOptions<TState>,
) => PopArgument<StateCreator<TState, [], []>>;

const zundoImpl: ZundoImpl = (config, baseOptions) => (set, get, _store) => {
  const options = {
    partialize: (state: TState) => state,
    handleSet: (handleSetCb: typeof set) => handleSetCb,
    ...baseOptions,
  };
  const { partialize, handleSet: userlandSetFactory } = options;

  type TState = ReturnType<typeof config>;
  type StoreAddition = StoreApi<TemporalState<TState>>;

  const temporalStore = createTemporalStore<TState>(set, get, options);

  const store = _store as Mutate<
    StoreApi<TState>,
    [['temporal', StoreAddition]]
  >;
  store.temporal = temporalStore;

  const curriedUserLandSet = userlandSetFactory(
    temporalStore.getState().__internal.handleUserSet,
  );

  const modifiedSetter: typeof set = (state, replace) => {
    // TODO: get() can eventually be replaced with the state in the callback
    const pastState = partialize(get());
    set(state, replace);
    curriedUserLandSet(pastState);
  };

  return config(modifiedSetter, get, _store);
};

// TODO: rename this to temporal
export const zundo = zundoImpl as unknown as Zundo;

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never;

export type Write<T, U> = Omit<T, keyof U> & U;
