import createVanilla, { StoreApi } from 'zustand/vanilla';

type onSave<State> = (pastState: State, currentState: State) => void;

export interface TemporalStateWithInternals<TState> {
  pastStates: TState[];
  futureStates: TState[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  trackingState: 'paused' | 'tracking';
  pause: () => void;
  resume: () => void;

  setOnSave: (onSave: onSave<TState>) => void;
  __internal: {
    onSave: onSave<TState>;
    handleUserSet: (pastState: TState) => void;
  };
}

export interface ZundoOptions<State, TemporalState = State> {
  partialize?: (state: State) => TemporalState;
  limit?: number;
  equality?: (a: State, b: State) => boolean;
  /* called when saved */
  onSave?: onSave<State>;
  /* Middleware for the temporal setter */
  handleSet?: (
    handleSet: StoreApi<State>['setState'],
  ) => StoreApi<State>['setState'];
}

// TODO: rename this to factory
export const createTemporalStore = <TState>(
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
        handleUserSet: (pastState: TState) => {
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
