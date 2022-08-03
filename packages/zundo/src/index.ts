import {
  StateCreator,
  StoreMutatorIdentifier,
  Mutate,
  StoreApi,
} from 'zustand';
import { createTemporalStore, Temporal, ZundoOptions } from './temporal';

type Zundo = <
  TState extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  UState extends object = TState,
>(
  config: StateCreator<TState, [...Mps, ['temporal', unknown]], Mcs>,
  options?: ZundoOptions<TState, UState>,
) => StateCreator<TState, Mps, [['temporal', Temporal<UState>], ...Mcs]>;

declare module 'zustand' {
  interface StoreMutators<S, A> {
    temporal: Write<Cast<S, object>, { temporal: A }>;
  }
}

type ZundoImpl = <TState extends object>(
  config: PopArgument<StateCreator<TState, [], []>>,
  options: ZundoOptions<TState>,
) => PopArgument<StateCreator<TState, [], []>>;

const zundoImpl: ZundoImpl =
  (
    config,
    options = {
      partialize: (state) => state,
    },
  ) =>
  (set, get, _store) => {
    type TState = ReturnType<typeof config>;
    type StoreAddition = Temporal<TState>;

    const temporalStore = createTemporalStore<TState>(set, get, options);
    const { undo, redo, clear, pastStates, futureStates } =
      temporalStore.getState();

    const store = _store as Mutate<
      StoreApi<TState>,
      [['temporal', StoreAddition]]
    >;
    store.temporal = { undo, redo, clear, pastStates, futureStates };

    const modifiedSetter: typeof set = (state, replace) => {
      pastStates.push(options.partialize(get()));
      set(state, replace);
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
