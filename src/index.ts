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
        (store.temporal.getState() as _TemporalState<TState>)._handleSet,
      ) || (store.temporal.getState() as _TemporalState<TState>)._handleSet;

    // const setState = store.setState;
    // Modify the setState function to call the userlandSet function
    // TODO: this isn't using the setState, but instead is using set to call the userlandSet. Is that an issue? It's not pulling off the store.setState function which is an issue we need to fix.
    store.setState = curriedHandleSet;

    return config(
      // Modify the set function to call the userlandSet function
      curriedHandleSet,
      get,
      store,
    );
  };
  return configWithTemporal as StateCreator<TState, [], []>;
}) as unknown as Zundo;

export type { ZundoOptions, Zundo, TemporalState };
