import { type StoreApi } from 'zustand/vanilla';
import type { TemporalStateWithInternals, ZundoOptions } from './types';
import { onSave } from "./types";

export type StateWithTemporal<T> = T & { _temporal: TemporalStateWithInternals<T> }

export const sanitizeUserState = <T>(state: StateWithTemporal<T>): T => {
  const cleanState = { ...state } as Partial<typeof state>
  delete cleanState._temporal
  return cleanState as T
}

export const createTemporal = <TState>(
  set: StoreApi<StateWithTemporal<TState>>['setState'],
  get: StoreApi<StateWithTemporal<TState>>['getState'],
  baseOptions?: ZundoOptions<TState>,
) => {
  const options = {
    partialize: (state: TState) => state,
    equality: (a: TState, b: TState) => false,
    onSave: () => {},
    ...baseOptions,
  };
  const { partialize, onSave, limit, equality } = options;

  const pastStates: TState[] = [];
  const futureStates: TState[] = [];

  return {
    pastStates,
    futureStates,
    undo: (steps = 1) => {
      const ps = get()._temporal.pastStates.slice();
      const fs = get()._temporal.futureStates.slice();
      if (ps.length === 0) {
        return;
      }

      const skippedPastStates = ps.splice(
        ps.length - (steps - 1),
      );
      const pastState = ps.pop();
      if (pastState) {
        fs.push(partialize(sanitizeUserState(get())));
        set(pastState);
      }

      fs.push(...skippedPastStates.reverse());
      set(state => ({ ...state, _temporal: { ...state._temporal, pastStates: ps, futureStates: fs } }));
    },
    redo: (steps = 1) => {
      const ps = get()._temporal.pastStates.slice();
      const fs = get()._temporal.futureStates.slice();
      if (fs.length === 0) {
        return;
      }

      const skippedFutureStates = fs.splice(
        fs.length - (steps - 1),
      );
      const futureState = fs.pop();
      if (futureState) {
        ps.push(partialize(sanitizeUserState(get())));
        set(futureState);
      }

      ps.push(...skippedFutureStates.reverse());
      set(state => ({ ...state, _temporal: { ...state._temporal, pastStates: ps, futureStates: fs } }));
    },
    clear: () => {
      set(state => ({ ...state, _temporal: { ...state._temporal, pastStates: [], futureStates: [] } }));
    },
    trackingStatus: 'tracking',
    pause: () => {
      set(state => ({ ...state, _temporal: { ...state._temporal, trackingStatus: 'paused' } }));
    },
    resume: () => {
      set(state => ({ ...state, _temporal: { ...state._temporal, trackingStatus: 'tracking' } }));
    },
    setOnSave: (onSave: onSave<TState>) => {
      set((state) => ({ ...state, _temporal: { ...state._temporal, __internal: { ...state._temporal.__internal, onSave } } }));
    },
    __internal: {
      onSave,
      handleUserSet: (pastState: TState) => {
        const { trackingStatus, pastStates, __internal } = get()._temporal;
        const ps = pastStates.slice();
        const currentState = partialize(sanitizeUserState(get()));
        if (
          trackingStatus === 'tracking' &&
          !equality(currentState, pastState)
        ) {
          if (limit && ps.length >= limit) {
            ps.shift();
          }
          ps.push(pastState);
          __internal.onSave?.(pastState, currentState);
          set(state => ({ ...state, _temporal: { ...state._temporal, pastStates: ps, futureStates: [] } }));
        }
      },
    },
  };
};
