import type { StateCreator, StoreApi } from 'zustand';
import type { _TemporalState, ZundoOptions } from './types';

export const temporalStateCreator = <TState>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  options?: ZundoOptions<TState>,
) => {
  const stateCreator: StateCreator<_TemporalState<TState>, [], []> = (
    set,
    get,
  ) => {
    return {
      pastStates: options?.pastStates || [],
      futureStates: options?.futureStates || [],
      undo: (steps = 1) => {
        // Fastest way to clone an array on Chromium. Needed to create a new array reference
        const pastStates = get().pastStates.slice();
        const futureStates = get().futureStates.slice();
        if (pastStates.length) {
          // Based on the steps, get values from the pastStates array and push them to the futureStates array
          while (steps--) {
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
          // While loop is fastest: https://stackoverflow.com/questions/5349425/whats-the-fastest-way-to-loop-through-an-array-in-javascript
          // Based on the steps, get values from the futureStates array and push them to the pastStates array
          while (steps--) {
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
        if (get().trackingStatus == 'tracking') {
          const currentState = options?.partialize?.(userGet()) || userGet();
          if (!options?.equality?.(pastState, currentState)) {
            const pastStates = get().pastStates.slice();
            // This naively assumes that only one new state can be added at a time
            if (options?.limit && pastStates.length >= options?.limit) {
              pastStates.shift();
            }
            pastStates.push(pastState);
            get()._onSave?.(pastState, currentState);
            set({ pastStates, futureStates: [] });
          }
        }
      },
    };
  };
  // Cast to a version of the store that does not include "temporal" addition
  return stateCreator as StateCreator<_TemporalState<TState>, [], []>;
};
