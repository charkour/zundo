import createVanilla, {
  GetState,
  State,
  StoreApi,
  SetState,
} from 'zustand/vanilla';

export interface TemporalState<TState extends State> extends State {
  pastStates: TState[];
  futureStates: TState[];

  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export type TemporalStore<TState extends State> = StoreApi<
  TemporalState<TState>
>;

export const createTemporalStore = <TState extends State>(
  userSet: SetState<TState>,
  userGet: GetState<TState>,
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
        futureStates.push(userGet());
        userSet(pastState);
      }
    };

    const redo = () => {
      if (futureStates.length === 0) {
        return;
      }

      const futureState = futureStates.pop();
      if (futureState) {
        pastStates.push(userGet());
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
