import {
  StateCreator,
  StoreMutatorIdentifier,
  Mutate,
  StoreApi,
} from 'zustand';
import { createTemporalStore, TemporalState, ZundoOptions } from './temporal';
export type { ZundoOptions, TemporalState } from './temporal';

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
    equality: (a: TState, b: TState) => false,
    ...baseOptions,
  };
  const { partialize, limit, equality } = options;

  type TState = ReturnType<typeof config>;
  type StoreAddition = StoreApi<TemporalState<TState>>;

  const temporalStore = createTemporalStore<TState>(set, get, options);
  const { getState, setState } = temporalStore;

  const store = _store as Mutate<
    StoreApi<TState>,
    [['temporal', StoreAddition]]
  >;
  store.temporal = temporalStore;

  const modifiedSetter: typeof set = (state, replace) => {
    const { state: trackingState, pastStates, futureStates } = getState();
    const pastState = partialize(get());
    set(state, replace);
    const currentState = partialize(get());
    if (trackingState === 'tracking' && !equality(currentState, pastState)) {
      if (limit && pastStates.length >= limit) {
        pastStates.shift();
      }
      pastStates.push(pastState);
      futureStates.length = 0;
    }
  };

  return config(modifiedSetter, get, _store);
};

export const zundo = zundoImpl as unknown as Zundo;

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never;

export type Write<T extends object, U extends object> = Omit<T, keyof U> & U;

type Cast<T, U> = T extends U ? T : U;
