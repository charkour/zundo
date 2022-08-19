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
export type TemporalState<TState extends object> = Omit<
  TemporalStateWithInternals<TState>,
  '__internal'
>;

type Zundo = <
  TState extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  UState extends object = TState,
>(
  config: StateCreator<TState, [...Mps, ['temporal', unknown]], Mcs>,
  options?: ZundoOptions<TState, UState>,
) => StateCreator<
  TState,
  Mps,
  [['temporal', StoreApi<TemporalState<UState>>], ...Mcs]
>;

declare module 'zustand' {
  interface StoreMutators<S, A> {
    temporal: Write<Cast<S, object>, { temporal: A }>;
  }
}

type ZundoImpl = <TState extends object>(
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
  const { getState, setState } = temporalStore;

  const store = _store as Mutate<
    StoreApi<TState>,
    [['temporal', StoreAddition]]
  >;
  store.temporal = temporalStore;

  const curriedUserLandSet = userlandSetFactory(
    getState().__internal.handleUserSet,
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

export type Write<T extends object, U extends object> = Omit<T, keyof U> & U;

type Cast<T, U> = T extends U ? T : U;
