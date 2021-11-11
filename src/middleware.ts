import { GetState, SetState, StateCreator, StoreApi } from 'zustand/vanilla';
import { createUndoStore, UndoStoreState } from './factory';
import { filterState } from './utils';
import isEqual from 'lodash.isequal';

export type UndoState = Partial<
  Pick<
    UndoStoreState,
    'undo' | 'redo' | 'clear' | 'setIsUndoHistoryEnabled'
  > & {
    getState: () => UndoStoreState;
  }
>;

export interface Options {
  // TODO: improve this type. ignored should only be fields on TState
  omit?: string[];
  allowUnchanged?: boolean;
  historyDepthLimit?: number;
  debounceDurationMs?: number
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
      /* TODO: const, should call this function and inject the values once, but it does
      it on every action call currently. */
      const {
        undo,
        clear,
        redo,
        setIsUndoHistoryEnabled,
        isUndoHistoryEnabled,
        lastStateBeforeDebounce,
        debounceTimer
      } = getState();
      // inject helper functions to user defined store.
      set({
        undo,
        clear,
        redo,
        getState,
        setIsUndoHistoryEnabled,
      });

      // Get the last state before updating state
      const lastState = filterState({ ...get() }, options?.omit);

      set(args);

      // Get the current state after updating state
      const currState = filterState({ ...get() }, options?.omit);

      // Only store changes if state isn't equal (or option has been set)
      const shouldStoreChange =
        isUndoHistoryEnabled &&
        (!isEqual(lastState, currState) || options?.allowUnchanged);

      const limit = options?.historyDepthLimit;

      if (shouldStoreChange) {
        debounceTimer && clearTimeout(debounceTimer);

        setState({
          // Store the last state before a bunch of changes happen in succession
          lastStateBeforeDebounce: lastStateBeforeDebounce ? lastStateBeforeDebounce : lastState,
          debounceTimer: setTimeout(() => {
            const { prevStates, lastStateBeforeDebounce } = getState();
  
            if (limit && prevStates.length >= limit) {
              // pop front
              prevStates.shift();
            }
            
            setState({
              prevStates: [...prevStates, lastStateBeforeDebounce],
              futureStates: [],
              // Once all of the changes have happened, clear lastStateBeforeDebounce
              lastStateBeforeDebounce: undefined,
              options,
            });
          }, options?.debounceDurationMs),
          setStore: set,
          getStore: get,
        })
      }
    },
    get,
    api
  );
};

export default undoMiddleware;
