import { GetState, SetState, StateCreator, StoreApi } from 'zustand/vanilla';
import { createUndoStore, UndoStoreState } from './factory';
import { filterState } from './utils';

export type UndoState = Partial<
  Pick<UndoStoreState, 'undo' | 'redo' | 'clear'> & {
    getState: () => UndoStoreState;
  }
>;

export interface Options {
  // TODO: improve this type. ignored should only be fields on TState
  omit?: string[];
}

// custom zustand middleware to get previous state
export const undoMiddleware = <TState extends UndoState>(
  config: StateCreator<TState>,
  options?: Options
) => (set: SetState<TState>, get: GetState<TState>, api: StoreApi<TState>) => {
  const undoStore = createUndoStore();
  const { getState, setState } = undoStore;
  return config(
    args => {
      setState({
        prevStates: [
          ...getState().prevStates,
          filterState({ ...get() }, options?.omit || []),
        ],
        setStore: set,
        futureStates: [],
        getStore: get,
        options,
      });
      /* TODO: const, should call this function and inject the values once, but it does
        it on every action call currently. */
      const { undo, clear, redo } = getState();

      // inject helper functions to user defined store.
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
