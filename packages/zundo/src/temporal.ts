import { createStore, type StoreApi, type StateCreator } from 'zustand';
import type {
  _TemporalState as TemporalState,
  TemporalStateCreator,
  ZundoOptions,
} from './types';

export const createVanillaTemporal = <TState>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  options?: ZundoOptions<TState>,
) => {
  const stateCreator: TemporalStateCreator<TState> = (set, get) => {
    return {
      pastStates: options?.pastStates || [],
      futureStates: options?.futureStates || [],
      undo: (steps = 1) => {
        // Fastest way to clone an array on Chromium. Needed to create a new array reference
        const pastStates = get().pastStates.slice();
        const futureStates = get().futureStates.slice();
        if (pastStates.length) {
          // Based on the steps, get values from the pastStates array and push them to the futureStates array
          for (let i = 0; i < steps; i++) {
            const pastState = pastStates.pop();
            if (pastState) {
              futureStates.push(options?.partialize?.(userGet()) || userGet());
              userSet(pastState);
            }
          }
          set({ pastStates, futureStates });
        }
      },
      redo: (steps = 1) => {
        // Fastest way to clone an array on Chromium. Needed to create a new array reference
        const pastStates = get().pastStates.slice();
        const futureStates = get().futureStates.slice();
        if (futureStates.length) {
          // Based on the steps, get values from the futureStates array and push them to the pastStates array
          for (let i = 0; i < steps; i++) {
            const futureState = futureStates.pop();
            if (futureState) {
              pastStates.push(options?.partialize?.(userGet()) || userGet());
              userSet(futureState);
            }
          }
          set({ pastStates, futureStates });
        }
      },
      clear: () => set({ pastStates: [], futureStates: [] }),
      trackingStatus: 'tracking',
      pause: () => set({ trackingStatus: 'paused' }),
      resume: () => set({ trackingStatus: 'tracking' }),
      setOnSave: (_onSave) => set({ _onSave }),
      // Internal properties
      _onSave: options?.onSave,
      _handleSet: (pastState) => {
        const trackingStatus = get().trackingStatus;
        const onSave = get()._onSave;
        const pastStates = get().pastStates.slice();
        const currentState = options?.partialize?.(userGet()) || userGet();
        if (
          trackingStatus === 'tracking' &&
          !options?.equality?.(currentState, pastState)
        ) {
          // This naively assumes that only one new state can be added at a time
          if (options?.limit && pastStates.length >= options?.limit) {
            pastStates.shift();
          }
          pastStates.push(pastState);
          onSave?.(pastState, currentState);
          set({ pastStates, futureStates: [] });
        }
      },
    };
  };
  return createStore<TemporalState<TState>>(
    (options?.wrapTemporal?.(stateCreator) ||
      // Cast to a version of the store that does not include "temporal" addition
      stateCreator) as TemporalStateCreator<TState>,
  );
};
