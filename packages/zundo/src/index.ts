import {
  type StateCreator,
  type StoreMutatorIdentifier,
  type Mutate,
  type StoreApi,
  createStore,
} from 'zustand';
import { temporalStateCreator } from './temporal';
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
  options: ZundoOptions<TState>,
): StateCreator<TState, [], []> => {
  type StoreAddition = StoreApi<TemporalState<TState>>;
  type StoreApiWithAddition = Mutate<
    StoreApi<TState>,
    [['temporal', StoreAddition]]
  >;

  return ((
    _set: StoreApi<TState>['setState'],
    get: StoreApi<TState>['getState'],
    api: StoreApiWithAddition,
  ): TState => {
    // Add the temporal store to the userland store
    api.temporal = createStore(
      // If wrapTemporal is defined, use it to wrap the temporal store
      options?.wrapTemporal?.(temporalStateCreator(_set, get, api, options)) ||
        temporalStateCreator(_set, get, api, options),
    );
    return config(
      // Get the new userland set function that interfaces with the temporal store to add past states when called
      (api.temporal.getState() as _TemporalState<TState>)._userSet,
      get,
      api,
    );
  }) as StateCreator<TState, [], []>;
}) as unknown as Zundo;

export type { ZundoOptions, Zundo, TemporalState };
