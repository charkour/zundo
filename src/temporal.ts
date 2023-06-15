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
        if (get().pastStates.length) {
          // Add the current state to the future states
          get().futureStates.push(
            options?.partialize?.(userGet()) || userGet(),
          );

          const statesToApply = get().pastStates.splice(-steps, steps);
          userSet(statesToApply.shift()!);
          set({
            pastStates: get().pastStates,
            futureStates: get().futureStates.concat(statesToApply.reverse()),
          });
        }
      },
      redo: (steps = 1) => {
        if (get().futureStates.length) {
          // Add the current state to the past states
          get().pastStates.push(options?.partialize?.(userGet()) || userGet());

          const statesToApply = get().futureStates.splice(-steps, steps);

          userSet(statesToApply.shift()!);
          set({
            futureStates: get().futureStates,
            pastStates: get().pastStates.concat(statesToApply.reverse()),
          });
        }
      },
      clear: () => set({ pastStates: [], futureStates: [] }),
      isTracking: true,
      pause: () => set({ isTracking: false }),
      resume: () => set({ isTracking: true }),
      setOnSave: (_onSave) => set({ _onSave }),
      // Internal properties
      _onSave: options?.onSave,
      _handleSet: (pastState) => {
        if (get().isTracking) {
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
