import type {
  StateCreator,
  StoreMutatorIdentifier,
  Mutate,
  StoreApi,
} from 'zustand';
import { createVanillaTemporal } from './temporal';
import type {
  TemporalState,
  _TemporalState,
  Write,
  ZundoOptions,
} from './types';

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

export const temporal = (<TState>(
  config: StateCreator<TState, [], []>,
  {
    partialize = (state) => state,
    handleSet = (handleSetCb) => handleSetCb,
    ...restOptions
  } = {} as ZundoOptions<TState>,
): StateCreator<TState, [], []> => {
  type StoreAddition = StoreApi<TemporalState<TState>>;
  type StoreWithAddition = Mutate<
    StoreApi<TState>,
    [['temporal', StoreAddition]]
  >;
  const configWithTemporal = (
    set: StoreApi<TState>['setState'],
    get: StoreApi<TState>['getState'],
    store: StoreWithAddition,
  ) => {
    store.temporal = createVanillaTemporal<TState>(
      set,
      get,
      partialize,
      restOptions,
    );

    const curriedHandleSet = handleSet(
      (store.temporal.getState() as _TemporalState<TState>)
        ._handleSet,
    );

    const setState = store.setState;
    // Modify the setState function to call the userlandSet function
    store.setState = (state, replace) => {
      // Get most up to date state. The state from the callback might be a partial state.
      // The order of the get() and set() calls is important here.
      const pastState = partialize(get());
      setState(state, replace);
      curriedHandleSet(pastState);
    };

    return config(
      // Modify the set function to call the userlandSet function
      (state, replace) => {
        // Get most up-to-date state. The state from the callback might be a partial state.
        // The order of the get() and set() calls is important here.
        const pastState = partialize(get());
        set(state, replace);
        curriedHandleSet(pastState);
      },
      get,
      store,
    );
  };
  return configWithTemporal as StateCreator<TState, [], []>;
}) as unknown as Zundo;

export type { ZundoOptions, Zundo, TemporalState };
