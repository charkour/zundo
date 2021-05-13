import { GetState, SetState, StateCreator, StoreApi } from 'zustand/vanilla';
import { createUndoStore, UndoStoreState } from './factory';

export type UndoState = Partial<
  Pick<UndoStoreState, 'undo' | 'redo' | 'clear'> & {
    getState: () => UndoStoreState;
  }
>;

// custom middleware to get previous state
export const undoMiddleware = <TState extends UndoState>(
  config: StateCreator<TState>
) => (set: SetState<TState>, get: GetState<TState>, api: StoreApi<TState>) => {
  const undoStore = createUndoStore();
  const { getState, setState } = undoStore;
  return config(
    args => {
      setState({
        prevStates: [...getState().prevStates, { ...get() }],
        setStore: set,
        futureStates: [],
        getStore: get,
      });
      // TODO: const, should call this function and inject the values once, but it does
      // it on every action call currently.
      const { undo, clear, redo } = getState();
      set({
        undo,
        clear,
        redo,
        getState,
      });

      set(args);
    },
    get,
    api
  );
};

export default undoMiddleware;
