import createVanilla, {
  GetState,
  State,
  StoreApi,
  SetState,
} from 'zustand/vanilla';

interface TemporalState<TState extends State> extends State {
  pastStates: TState[];
  futureStates: TState[];

  undo: () => void;
  redo: () => void;
  clear: () => void;
}

type TemporalStore<TState extends State> = StoreApi<TemporalState<TState>>;

export type Temporal<TState extends State> = Pick<
  ReturnType<TemporalStore<TState>['getState']>,
  'undo' | 'redo' | 'clear' | 'pastStates' | 'futureStates'
>;

export interface ZundoOptions<State, TemporalState = State> {
  partialize: (state: State) => TemporalState;
}

export const createTemporalStore = <TState extends State>(
  userSet: SetState<TState>,
  userGet: GetState<TState>,
  { partialize }: ZundoOptions<TState> = {
    partialize: (state) => state,
  },
) => {
  return createVanilla<TemporalState<TState>>()(() => {
    const pastStates: TState[] = [];
    const futureStates: TState[] = [];

    const undo = () => {
      if (pastStates.length === 0) {
        return;
      }

      const pastState = pastStates.pop();
      if (pastState) {
        futureStates.push(partialize(userGet()));
        userSet(pastState);
      }
    };

    const redo = () => {
      if (futureStates.length === 0) {
        return;
      }

      const futureState = futureStates.pop();
      if (futureState) {
        pastStates.push(partialize(userGet()));
        userSet(futureState);
      }
    };

    const clear = () => {
      pastStates.length = 0;
      futureStates.length = 0;
    };

    return {
      pastStates,
      futureStates,
      undo,
      redo,
      clear,
    };
  });
};
