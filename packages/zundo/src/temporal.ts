import createVanilla, { StoreApi } from 'zustand/vanilla';

type onSave<State extends object> = (
  pastState: State,
  currentState: State,
) => void;

export interface TemporalStateWithInternals<TState extends object> {
  pastStates: TState[];
  futureStates: TState[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  state: 'paused' | 'tracking';
  pause: () => void;
  resume: () => void;

  setOnSave: (onSave: onSave<TState>) => void;
  __internal: {
    onSave: onSave<TState>;
  };
}

export interface ZundoOptions<State extends object, TemporalState = State> {
  partialize?: (state: State) => TemporalState;
  limit?: number;
  equality?: (a: State, b: State) => boolean;
  onSave?: onSave<State>;
}

export const createTemporalStore = <TState extends object>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  baseOptions?: ZundoOptions<TState>,
) => {
  const options = {
    partialize: (state: TState) => state,
    onSave: () => {},
    ...baseOptions,
  };
  const { partialize, onSave } = options;
  return createVanilla<TemporalStateWithInternals<TState>>()((set) => {
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
      state: 'tracking',
      pause: () => {
        set({ state: 'paused' });
      },
      resume: () => {
        set({ state: 'tracking' });
      },
      setOnSave: (onSave) => {
        set({ __internal: { onSave } });
      },
      __internal: {
        onSave,
      },
    };
  });
};
