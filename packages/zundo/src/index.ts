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
  TemporalStateWithInternals,
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
    wrapTemporal = (init) => init,
    ...restOptions
  } = {} as ZundoOptions<TState>,
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
    api.temporal = createStore(
      wrapTemporal(temporalStateCreator(_set, get, api, restOptions)),
    );
    const set = (api.temporal.getState() as TemporalStateWithInternals<TState>)
      .__newSet;

    return config(set, get, api);
  }) as StateCreator<TState, [], []>;
}) as unknown as Zundo;

export type { ZundoOptions, Zundo, TemporalState };
