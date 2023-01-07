import type {
  StateCreator,
  StoreMutatorIdentifier,
  StoreApi,
} from 'zustand';
import {createTemporal, sanitizeUserState, StateWithTemporal} from './temporal';
import type { PopArgument, TemporalState, Write, ZundoOptions } from './types';

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
  type TState = ReturnType<typeof config>;

  const options = {
    partialize: (state: TState) => state,
    handleSet: (handleSetCb: typeof set) => handleSetCb,
    ...baseOptions,
  };
  const { partialize, handleSet: userlandSetFactory } = options;

  // @ts-ignore
  const temporalStore = createTemporal<TState>(set, get, options);

  const curriedUserLandSet = userlandSetFactory(
    temporalStore.__internal.handleUserSet,
  );

  const modifiedSetter: typeof set = (state, replace) => {
    // Get most up to date state. Should this be the same as the state in the callback?
    // @ts-ignore
    const pastState = partialize(sanitizeUserState(get()));
    set(state, replace);
    curriedUserLandSet(pastState);
  };

  return {
    ...config(modifiedSetter, get, _store),
    _temporal: temporalStore
  };
};

export const temporal = zundoImpl as unknown as Zundo;
