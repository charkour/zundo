import { GetState, SetState, StateCreator, StoreApi } from 'zustand/vanilla';
import isEqual from 'lodash.isequal';
import { createUndoStore, UndoStoreState } from './factory';
import { filterState } from './utils';
import { Options } from './types';

export type UndoState = Partial<
  Pick<
    UndoStoreState,
    'undo' | 'redo' | 'clearUndoHistory' | 'setIsUndoHistoryEnabled'
  > & {
    getState: () => UndoStoreState;
  }
>;

// custom zustand middleware to get previous state
export const undoMiddleware =
  <TState extends UndoState>(config: StateCreator<TState>, options?: Options) =>
  (set: SetState<TState>, get: GetState<TState>, api: StoreApi<TState>) => {
    const undoStore = createUndoStore();
    const { getState, setState } = undoStore;

    return config(
      (args) => {
        /* TODO: const, should call this function and inject the values once, but it does
      it on every action call currently. */
        const {
          undo,
          clearUndoHistory,
          redo,
          setIsUndoHistoryEnabled,
          isUndoHistoryEnabled,
          isCoolingOff,
          coolOffTimer,
        } = getState();
        // inject helper functions to user defined store.
        set({
          undo,
          clearUndoHistory,
          redo,
          getState,
          setIsUndoHistoryEnabled,
        });

        // Get the last state before updating state
        const lastState = filterState({ ...get() }, options);

        set(args);

        // Get the current state after updating state
        const currState = filterState({ ...get() }, options);

        // Only store changes if state isn't equal (or option has been set)
        const shouldStoreChange =
          isUndoHistoryEnabled &&
          (!isEqual(lastState, currState) || options?.allowUnchanged);

        const limit = options?.historyDepthLimit;

        if (shouldStoreChange) {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          coolOffTimer && clearTimeout(coolOffTimer);

          if (!isCoolingOff) {
            const { prevStates } = getState();

            if (limit && prevStates.length >= limit) {
              // pop front
              prevStates.shift();
            }

            setState({
              prevStates: [...prevStates, lastState],
              futureStates: [],
              options,
              setStore: set,
              getStore: get,
            });
          }

          setState({
            isCoolingOff: true,
            coolOffTimer: window.setTimeout(() => {
              setState({
                isCoolingOff: false,
              });
            }, options?.coolOffDurationMs),
          });
        }
      },
      get,
      api,
    );
  };

export default undoMiddleware;
