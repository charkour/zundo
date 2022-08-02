import createVanilla, {
  GetState,
  State,
  StoreApi,
  SetState,
} from 'zustand/vanilla';

interface TemporalState<TState extends State> extends State {
  pastStates: TState[];
  futureStates: TState[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
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
  { partialize }: ZundoOptions<TState>,
) => {
  return createVanilla<TemporalState<TState>>()(() => {
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
        // TODO: call set?
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
        // TODO: call set?
      }
      pastStates.push(...skippedFutureStates);
    };

    const clear = () => {
      pastStates.length = 0;
      futureStates.length = 0;
      // TODO: call set?
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
