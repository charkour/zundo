import createVanilla, { StoreApi } from 'zustand/vanilla';

export interface TemporalState<TState extends object> {
  pastStates: TState[];
  futureStates: TState[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  state: 'paused' | 'tracking';
  pause: () => void;
  resume: () => void;
}

export interface ZundoOptions<State, TemporalState = State> {
  partialize: (state: State) => TemporalState;
}

export const createTemporalStore = <TState extends object>(
  userSet: StoreApi<TState>['setState'],
  userGet: StoreApi<TState>['getState'],
  { partialize }: ZundoOptions<TState>,
) => {
  return createVanilla<TemporalState<TState>>()((set, get) => {
    const pastStates: TState[] = [];
    const futureStates: TState[] = [];

    const undo = (steps = 1) => {
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
    };

    const redo = (steps = 1) => {
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
    };

    const clear = () => {
      pastStates.length = 0;
      futureStates.length = 0;
    };

    const state = 'tracking';

    const pause = () => {
      set({ state: 'paused' });
    };

    const resume = () => {
      set({ state: 'tracking' });
    };

    return {
      pastStates,
      futureStates,
      undo,
      redo,
      clear,
      state,
      pause,
      resume,
    };
  });
};
