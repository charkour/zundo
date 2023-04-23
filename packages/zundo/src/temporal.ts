import { createStore, type StoreApi, type StateCreator } from 'zustand';
import type {
  TemporalStateWithInternals as TemporalState,
  ZundoOptions,
} from './types';

export const createVanillaTemporal = <TState>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  partialize: (state: TState) => TState,
  {
    equality,
    onSave,
    limit,
    pastStates = [],
    futureStates = [],
    wrapTemporal = (init) => init,
  } = {} as Omit<ZundoOptions<TState>, 'handleSet'>,
) => {
  const stateCreator: StateCreator<TemporalState<TState>, [], []> = wrapTemporal(
    (set, get) => {
      return {
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
    },
    // Cast to a version of the store that does not include "temporal" addition
  ) as StateCreator<TemporalState<TState>, [], []>;
  return createStore<TemporalState<TState>>(stateCreator);
};
