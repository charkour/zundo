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
        const ps = get().pastStates.slice();
        const fs = get().futureStates.slice();
        if (ps.length === 0) {
          return;
        }

        const skippedPastStates = ps.splice(ps.length - (steps - 1));
        const pastState = ps.pop();
        if (pastState) {
          fs.push(partialize(userGet()));
          userSet(pastState);
        }

        fs.push(...skippedPastStates.reverse());
        set({ pastStates: ps, futureStates: fs });
      },
      redo: (steps = 1) => {
        const ps = get().pastStates.slice();
        const fs = get().futureStates.slice();
        if (fs.length === 0) {
          return;
        }

        const skippedFutureStates = fs.splice(fs.length - (steps - 1));
        const futureState = fs.pop();
        if (futureState) {
          ps.push(partialize(userGet()));
          userSet(futureState);
        }

        ps.push(...skippedFutureStates.reverse());
        set({ pastStates: ps, futureStates: fs });
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
