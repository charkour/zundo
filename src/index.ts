import { createStore } from 'zustand';
import { temporalStateCreator } from './temporal';
import type {
  StateCreator,
  StoreMutatorIdentifier,
  Mutate,
  StoreApi,
} from 'zustand';
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
    store.temporal = createStore(
      options?.wrapTemporal?.(temporalStateCreator(set, get, options)) ||
        temporalStateCreator(set, get, options),
    );

    const curriedHandleSet =
      options?.handleSet?.(
        (store.temporal.getState() as _TemporalState<TState>)
          ._handleSet as StoreApi<TState>['setState'],
      ) || (store.temporal.getState() as _TemporalState<TState>)._handleSet;

    const temporalHandleSet = (pastState: TState) => {
      if (!store.temporal.getState().isTracking) return;

      const currentState = options?.partialize?.(get()) || get();
      const deltaState = options?.diff?.(pastState, currentState);
      if (
        // Don't call handleSet if state hasn't changed, as determined by diff fn or equality fn
        !(
          // If the user has provided a diff function but nothing has been changed, deltaState will be null
          (
            deltaState === null ||
            // If the user has provided an equality function, use it
            options?.equality?.(pastState, currentState)
          )
        )
      ) {
        curriedHandleSet(pastState, undefined, currentState, deltaState);
      }
    };

    const setState = store.setState;
    // Modify the setState function to call the userlandSet function
    store.setState = (...args) => {
      // Get most up to date state. The state from the callback might be a partial state.
      // The order of the get() and set() calls is important here.
      const pastState = options?.partialize?.(get()) || get();
      setState(...args);
      temporalHandleSet(pastState);
    };

    return config(
      // Modify the set function to call the userlandSet function
      (...args) => {
        // Get most up-to-date state. The state from the callback might be a partial state.
        // The order of the get() and set() calls is important here.
        const pastState = options?.partialize?.(get()) || get();
        set(...args);
        temporalHandleSet(pastState);
      },
      get,
      store,
    );
  };
  return configWithTemporal as StateCreator<TState, [], []>;
}) as unknown as Zundo;

export type { ZundoOptions, Zundo, TemporalState };
