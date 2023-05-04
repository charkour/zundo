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

const zundoImpl = <TState>(
  config: StateCreator<TState, [], []>,
  {
    partialize = (state) => state,
    wrapTemporal = (init) => init,
    ...restOptions
  } = {} as ZundoOptions<TState>,
): StateCreator<TState, [], []> => {
  type StoreAddition = StoreApi<TemporalState<TState>>;
  type StoreApiWithAddition = Mutate<
    StoreApi<TState>,
    [['temporal', StoreAddition]]
  >;
  const configWithTemporal = (
    _set: StoreApi<TState>['setState'],
    get: StoreApi<TState>['getState'],
    api: StoreApiWithAddition,
  ) => {
    const setState = api.setState;
    const tconfig = temporalStateCreator(_set, get, partialize, restOptions);
    // Modify the setState function to call the userlandSet function
    let set: typeof _set = _set;
    const test: typeof tconfig = (tset, tget, tstore) => {

      api.setState = setterFactory(
        setState,
        get,
        partialize,
        restOptions.limit,
        restOptions.equality,
        tset,
        tget,
      );

      // Modify the set function to call the userlandSet function

      set = (state, replace) => {
        // Get most up-to-date state. The state from the callback might be a partial state.
        // The order of the get() and set() calls is important here.
        const pastState = partialize(get());
        // call original setter
        _set(state, replace);
        const trackingStatus = tget().trackingStatus,
          onSave = (tget() as any).__onSave,
          pastStates = tget().pastStates.slice(),
          currentState = partialize(get());
        if (
          trackingStatus === 'tracking' &&
          !restOptions.equality?.(currentState, pastState)
        ) {
          // This naively assumes that only one new state can be added at a time
          if (restOptions.limit && pastStates.length >= restOptions.limit) {
            pastStates.shift();
          }
          pastStates.push(pastState);
          onSave?.(pastState, currentState);
          tset({ pastStates, futureStates: [] });
        }
      };

      return tconfig(tset, tget, tstore);
    };
    api.temporal = createStore(wrapTemporal(test));

    return config(set, get, api);
  };
  return configWithTemporal as StateCreator<TState, [], []>;
};

export const temporal = zundoImpl as unknown as Zundo;
export type { ZundoOptions, Zundo, TemporalState };

const setterFactory = <TState>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  partialize: NonNullable<ZundoOptions<TState>['partialize']>,
  limit: ZundoOptions<TState>['limit'],
  equality: ZundoOptions<TState>['equality'],
  temporalSet: StoreApi<TemporalStateWithInternals<TState>>['setState'],
  temporalGet: StoreApi<TemporalStateWithInternals<TState>>['getState'],
): StoreApi<TState>['setState'] => {
  return (state, replace) => {
    // Get most up to date state. The state from the callback might be a partial state.
    // The order of the get() and set() calls is important here.
    const pastState = partialize(userGet());
    // call original setter
    userSet(state, replace);
    const trackingStatus = temporalGet().trackingStatus,
      onSave = (temporalGet() as any).__onSave,
      pastStates = temporalGet().pastStates.slice(),
      currentState = partialize(userGet());
    if (trackingStatus === 'tracking' && !equality?.(currentState, pastState)) {
      // This naively assumes that only one new state can be added at a time
      if (limit && pastStates.length >= limit) {
        pastStates.shift();
      }
      pastStates.push(pastState);
      onSave?.(pastState, currentState);
      temporalSet({ pastStates, futureStates: [] });
    }
  };
};
