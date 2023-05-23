import type { StoreApi } from 'zustand';
import type {
  TemporalStateCreator,
  _TemporalState,
  ZundoOptions,
} from './types';

export const temporalStateCreator = <TState>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  userApi: StoreApi<TState>,
  {
    equality,
    onSave,
    limit,
    pastStates = [],
    futureStates = [],
    handleSet,
    partialize = (state) => state,
  } = {} as ZundoOptions<TState>,
) => {
  const stateCreator: TemporalStateCreator<TState> = (set, get) => {
    // Modify the setState function to call the userlandSet function
    userApi.setState = setterFactory(
      userApi.setState,
      // Could also use userApi.getState() here, but this saves 4 bytes
      userGet,
      partialize,
      limit,
      equality,
      handleSet,
      set,
      get,
    );

    return {
      pastStates,
      futureStates,
      // Rather than using a default value for steps, using (steps || 1) saves 1 byte
      undo: (steps) => {
        // Fastest way to clone an array on Chromium. Needed to create a new array reference
        const pastStates = get().pastStates.slice();
        const futureStates = get().futureStates.slice();
        if (pastStates.length) {
          // Based on the steps, get values from the pastStates array and push them to the futureStates array
          for (let i = 0; i < (steps || 1); i++) {
            const pastState = pastStates.pop();
            if (pastState) {
              futureStates.push(partialize(userGet()));
              userSet(pastState);
            }
          }
          set({ pastStates, futureStates });
        }
      },
      // Rather than using a default value for steps, using (steps || 1) saves 2 bytes
      redo: (steps) => {
        // Fastest way to clone an array on Chromium. Needed to create a new array reference
        const pastStates = get().pastStates.slice();
        const futureStates = get().futureStates.slice();
        if (futureStates.length) {
          // Based on the steps, get values from the futureStates array and push them to the pastStates array
          for (let i = 0; i < (steps || 1); i++) {
            const futureState = futureStates.pop();
            if (futureState) {
              pastStates.push(partialize(userGet()));
              userSet(futureState);
            }
          }

          set({ pastStates, futureStates });
        }
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
      setOnSave: (_onSave) => {
        set({ _onSave });
      },
      // Internal properties
      _onSave: onSave,
      _handleSet: (pastState) => {
        const trackingStatus = get().trackingStatus,
          onSave = get()._onSave,
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
      _userSet: setterFactory(
        userSet,
        userGet,
        partialize,
        limit,
        equality,
        handleSet,
        set,
        get,
      ),
    };
  };
  return stateCreator;
};

const setterFactory = <TState>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  partialize: NonNullable<ZundoOptions<TState>['partialize']>,
  limit: ZundoOptions<TState>['limit'],
  equality: ZundoOptions<TState>['equality'],
  handleSet: ZundoOptions<TState>['handleSet'],
  temporalSet: StoreApi<_TemporalState<TState>>['setState'],
  temporalGet: StoreApi<_TemporalState<TState>>['getState'],
): StoreApi<TState>['setState'] => {
  return (state, replace) => {
    // Get most up-to-date state. The state from the callback might be a partial state.
    // The order of the get() and set() calls is important here.
    const pastState = partialize(userGet());
    // call original setter
    userSet(state, replace);

    // For backwards compatibility, will be removed in next version.
    if (handleSet) {
      handleSet(temporalGet()._handleSet)(pastState);
      return;
    }
    // Block above will be removed

    const trackingStatus = temporalGet().trackingStatus;
    const onSave = temporalGet()._onSave
    // TODO: in the next PR, once handleSet is removed, then we can move the into a nested if statement
    const pastStates = temporalGet().pastStates.slice()
    const currentState = partialize(userGet());
    // Equality is more expensive than the other checks, so we do it last
    if (trackingStatus === 'tracking' && !equality?.(currentState, pastState)) {
      // This naively assumes that only one new state can be added at a time
      if (limit && pastStates.length >= limit) {
        pastStates.shift();
      }
      pastStates.push(pastState);
      onSave?.(pastState, currentState);
      // TODO: after handleSet is removed, we should see if there is better perf by only setting futureStates to [] if it is not already []
      temporalSet({ pastStates, futureStates: [] });
    }
  };
};
