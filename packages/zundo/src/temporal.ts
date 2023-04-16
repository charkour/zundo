import { createStore, type StoreApi } from 'zustand';
import type { TemporalStateWithInternals, WithRequired, ZundoOptions } from './types';

export const createVanillaTemporal = <TState>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  {
    partialize,
    equality,
    onSave,
    limit,
  } = {} as Omit<WithRequired<ZundoOptions<TState>, | 'partialize'>, 'handleSet'>,
) => {

  return createStore<TemporalStateWithInternals<TState>>()((set, get) => {
    return {
      pastStates: [],
      futureStates: [],
      undo: (steps = 1) => {
        const { futureStates, pastStates } = get();
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
        const { futureStates, pastStates } = get();
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
      __handleUserSet: (pastState) => {
        const { trackingStatus, pastStates, __onSave } = get();
        const ps = pastStates.slice();
        const currentState = partialize(userGet());
        if (
          trackingStatus === 'tracking' &&
          !equality?.(currentState, pastState)
        ) {
          if (limit && ps.length >= limit) {
            ps.shift();
          }
          ps.push(pastState);
          __onSave?.(pastState, currentState);
          set({ pastStates: ps, futureStates: [] });
        }
      },
    };
  });
};
