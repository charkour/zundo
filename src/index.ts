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
  options?: ZundoOptions<TState>,
): StateCreator<TState, [], []> => {
  const configWithTemporal = (
    set: StoreApi<TState>['setState'],
    get: StoreApi<TState>['getState'],
    store: Mutate<
      StoreApi<TState>,
      [['temporal', StoreApi<TemporalState<TState>>]]
    >,
  ) => {
    store.temporal = createVanillaTemporal(set, get, options);

    const curriedHandleSet =
      options?.handleSet?.(
        (store.temporal.getState() as _TemporalState<TState>)._handleSet,
      ) || (store.temporal.getState() as _TemporalState<TState>)._handleSet;

    const setState = store.setState;
    // Modify the setState function to call the userlandSet function
    store.setState = (...args) => {
      // Get most up to date state. The state from the callback might be a partial state.
      // The order of the get() and set() calls is important here.
      const pastState = options?.partialize?.(get()) || get();
      setState(...args);
      curriedHandleSet(pastState);
    };

    return config(
      // Modify the set function to call the userlandSet function
      (...args) => {
        // Get most up-to-date state. The state from the callback might be a partial state.
        // The order of the get() and set() calls is important here.
        const pastState = options?.partialize?.(get()) || get();
        set(...args);
        curriedHandleSet(pastState);
      },
      get,
      store,
    );
  };
  return configWithTemporal as StateCreator<TState, [], []>;
}) as unknown as Zundo;

export type { ZundoOptions, Zundo, TemporalState };
