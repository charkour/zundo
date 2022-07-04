import {
  State,
  StateCreator,
  StoreMutatorIdentifier,
  Mutate,
  StoreApi,
} from 'zustand';
import { createTemporalStore, TemporalStore } from './temporal';
type Temporal<TState extends State> = Pick<
  ReturnType<TemporalStore<TState>['getState']>,
  'undo' | 'redo' | 'clear' | 'pastStates' | 'futureStates'
>;

type Zundo = <
  TState extends State,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  config: StateCreator<TState, [...Mps, ['temporal', Temporal<TState>]], Mcs>,
) => StateCreator<TState, Mps, [['temporal', Temporal<TState>], ...Mcs]>;

declare module 'zustand' {
  interface StoreMutators<State, StoreAddition> {
    temporal: Write<Cast<State, object>, { temporal: StoreAddition }>;
  }
}

type ZundoImpl = <TState extends State>(
  config: PopArgument<StateCreator<TState, [], []>>,
) => PopArgument<StateCreator<TState, [], []>>;

const zundoImpl: ZundoImpl = (config) => (set, get, _store) => {
  type TState = ReturnType<typeof config>;
  type StoreAddition = Temporal<TState>;

  const temporalStore = createTemporalStore<TState>(set, get);
  const { undo, redo, clear, pastStates, futureStates } =
    temporalStore.getState();

  const store = _store as Mutate<
    StoreApi<TState>,
    [['temporal', StoreAddition]]
  >;
  store.temporal = { undo, redo, clear, pastStates, futureStates };

  const modifiedSetter: typeof set = (state, replace) => {
    pastStates.push(get());
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

type Write<T extends object, U extends object> = Omit<T, keyof U> & U;

type Cast<T, U> = T extends U ? T : U;
