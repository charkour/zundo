import createVanilla, { type StoreApi } from 'zustand/vanilla';
import type { TemporalStateWithInternals, ZundoOptions } from './types';

export const createVanillaTemporal = <TState>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  baseOptions?: ZundoOptions<TState>,
) => {
  const options = {
    partialize: (state: TState) => state,
    equality: (a: TState, b: TState) => false,
    onSave: () => {},
    ...baseOptions,
  };
  const { partialize, onSave, limit, equality } = options;

  return createVanilla<TemporalStateWithInternals<TState>>()((set, get) => {
    const pastStates: TState[] = [];
    const futureStates: TState[] = [];

    return {
      pastStates,
      futureStates,
      undo: (steps = 1) => {
        if (pastStates.length === 0) {
          return;
        }

        const skippedPastStates = pastStates.splice(
          pastStates.length - (steps - 1),
        );
        const pastState = pastStates.pop();
        if (pastState) {
          futureStates.push(partialize(userGet()));
          userSet(pastState);
        }

        futureStates.push(...skippedPastStates);
      },
      redo: (steps = 1) => {
        if (futureStates.length === 0) {
          return;
        }

        const skippedFutureStates = futureStates.splice(
          futureStates.length - (steps - 1),
        );
        const futureState = futureStates.pop();
        if (futureState) {
          pastStates.push(partialize(userGet()));
          userSet(futureState);
        }

        pastStates.push(...skippedFutureStates);
      },
      clear: () => {
        pastStates.length = 0;
        futureStates.length = 0;
      },
      trackingState: 'tracking',
      pause: () => {
        set({ trackingState: 'paused' });
      },
      resume: () => {
        set({ trackingState: 'tracking' });
      },
      setOnSave: (onSave) => {
        set((state) => ({ __internal: { ...state.__internal, onSave } }));
      },
      __internal: {
        onSave,
        handleUserSet: (pastState) => {
          const { trackingState, pastStates, futureStates, __internal } = get();
          const currentState = partialize(userGet());
          if (
            trackingState === 'tracking' &&
            !equality(currentState, pastState)
          ) {
            if (limit && pastStates.length >= limit) {
              pastStates.shift();
            }
            pastStates.push(pastState);
            futureStates.length = 0;
            __internal.onSave?.(pastState, currentState);
          }
        },
      },
    };
  });
};
