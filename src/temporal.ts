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
          // userGet must be called before userSet
          const currentState = options?.partialize?.(userGet()) || userGet();

          const statesToApply = get().pastStates.splice(-steps, steps);

          // If there is length, we know that statesToApply is not empty
          const nextState = statesToApply.shift()!;
          userSet(nextState);
          set({
            pastStates: get().pastStates,
            futureStates: get().futureStates.concat(
              options?.diff?.(currentState, nextState) || currentState,
              statesToApply.reverse(),
            ),
          });
        }
      },
      redo: (steps = 1) => {
        if (get().futureStates.length) {
          // userGet must be called before userSet
          const currentState = options?.partialize?.(userGet()) || userGet();

          const statesToApply = get().futureStates.splice(-steps, steps);

          // If there is length, we know that statesToApply is not empty
          const nextState = statesToApply.shift()!;
          userSet(nextState);
          set({
            pastStates: get().pastStates.concat(
              options?.diff?.(currentState, nextState) || currentState,
              statesToApply.reverse(),
            ),
            futureStates: get().futureStates,
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
          const deltaState = options?.diff?.(pastState, currentState);

          // This naively assumes that only one new state can be added at a time
          if (options?.limit && get().pastStates.length >= options?.limit) {
            get().pastStates.shift();
          }

          get()._onSave?.(pastState, currentState);
          set({
            pastStates: get().pastStates.concat(deltaState || pastState),
            futureStates: [],
          });
        }
      },
    };
  };

  // Cast to a version of the store that does not include "temporal" addition
  return stateCreator as StateCreator<_TemporalState<TState>, [], []>;
};
