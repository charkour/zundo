import { Mutate, type StoreApi } from 'zustand';
import type {
  TemporalState,
  TemporalStateCreator,
  TemporalStateWithInternals,
  ZundoOptions,
} from './types';

export const temporalStateCreator = <TState>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  userApi: StoreApi<TState>,
  partialize: NonNullable<ZundoOptions<TState>['partialize']>,
  {
    equality,
    onSave,
    limit,
    pastStates = [],
    futureStates = [],
    handleSet,
  } = {} as ZundoOptions<TState>,
) => {
  type StoreAddition = StoreApi<TemporalState<TState>>;
  type StoreApiWithAddition = Mutate<
    StoreApi<TState>,
    [['temporal', StoreAddition]]
  >;

  // Make a reference to the original setState function
  const setState = userApi.setState;

  const stateCreator: TemporalStateCreator<TState> = (set, get) => {
    // Modify the setState function to call the userlandSet function
    userApi.setState = setterFactory(
      setState,
      userGet,
      partialize,
      set,
      get,
      limit,
      equality,
      handleSet,
    );

    // Modify the set function to call the userlandSet function
    const __newSet: typeof userSet = setterFactory(
      userSet,
      userGet,
      partialize,
      set,
      get,
      limit,
      equality,
      handleSet,
    );
    return {
      __newSet,
      pastStates,
      futureStates,
      undo: (steps = 1) => {
        // Fastest way to clone an array on Chromium. Needed to create a new array reference
        const pastStates = get().pastStates.slice();
        const futureStates = get().futureStates.slice();
        if (pastStates.length === 0) {
          return;
        }

        // Based on the steps, get values from the pastStates array and push them to the futureStates array
        for (let i = 0; i < steps; i++) {
          const pastState = pastStates.pop();
          if (pastState) {
            futureStates.push(partialize(userGet()));
            userSet(pastState);
          }
        }

        set({ pastStates, futureStates });
      },
      redo: (steps = 1) => {
        // Fastest way to clone an array on Chromium. Needed to create a new array reference
        const pastStates = get().pastStates.slice();
        const futureStates = get().futureStates.slice();
        if (futureStates.length === 0) {
          return;
        }

        // Based on the steps, get values from the futureStates array and push them to the pastStates array
        for (let i = 0; i < steps; i++) {
          const futureState = futureStates.pop();
          if (futureState) {
            pastStates.push(partialize(userGet()));
            userSet(futureState);
          }
        }

        set({ pastStates, futureStates });
      },
      clear: () => {
        set({ pastStates: [], futureStates: [] });
      },
      trackingStatus: 'tracking',
      pause: () => {
        set({ trackingStatus: 'paused' });
      },
      resume: () => {
        set({ trackingStatus: 'tracking' });
      },
      setOnSave: (__onSave) => {
        set({ __onSave });
      },
      // Internal properties
      __onSave: onSave,
      __handleSet: (pastState) => {
        const trackingStatus = get().trackingStatus,
          onSave = get().__onSave,
          pastStates = get().pastStates.slice(),
          currentState = partialize(userGet());
        if (
          trackingStatus === 'tracking' &&
          !equality?.(currentState, pastState)
        ) {
          // This naively assumes that only one new state can be added at a time
          if (limit && pastStates.length >= limit) {
            pastStates.shift();
          }
          pastStates.push(pastState);
          onSave?.(pastState, currentState);
          set({ pastStates, futureStates: [] });
        }
      },
    };
  };
  return stateCreator;
};

const setterFactory = <TState>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  partialize: NonNullable<ZundoOptions<TState>['partialize']>,
  temporalSet: StoreApi<TemporalStateWithInternals<TState>>['setState'],
  temporalGet: StoreApi<TemporalStateWithInternals<TState>>['getState'],
  limit: ZundoOptions<TState>['limit'],
  equality: ZundoOptions<TState>['equality'],
  handleSet: ZundoOptions<TState>['handleSet'],
): StoreApi<TState>['setState'] => {
  return (state, replace) => {
    // For backwards compatibility, will be removed in next version.
    if (handleSet) {
      userSet(state, replace);
      handleSet(temporalGet().__handleSet)(state, replace);
      return;
    }

    // Get most up-to-date state. The state from the callback might be a partial state.
    // The order of the get() and set() calls is important here.
    const pastState = partialize(userGet());
    // call original setter
    userSet(state, replace);
    const trackingStatus = temporalGet().trackingStatus,
      onSave = (temporalGet()).__onSave,
      pastStates = temporalGet().pastStates.slice(),
      currentState = partialize(userGet());
    // Equality is more expensive than the other checks, so we do it last
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
