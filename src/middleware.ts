import { Mutate, StoreApi } from 'zustand';
import isEqual from 'lodash.isequal';
import { createUndoStore } from './factory';
import { filterState } from './utils';
import {
  Options,
  UndoMiddleware,
  UndoMiddlewareImpl,
  UndoState,
} from './types';

// custom zustand middleware to get previous state
const undoMiddlewareImpl: UndoMiddlewareImpl =
  (f, options?: Options) => (set, get, _store) => {
    type T = ReturnType<typeof f>;

    const undoStore = createUndoStore();
    const { getState, setState } = undoStore;

    const { undo, redo, clear, setIsUndoHistoryEnabled } = getState();

    const store = _store as Mutate<StoreApi<T>, [['zundo', UndoState]]>;

    store.zundo = {
      undo,
      redo,
      clear,
      setIsUndoHistoryEnabled,
      getState,
    };

    return f(
      (args: any) => {
        const { isUndoHistoryEnabled, isCoolingOff, coolOffTimer } = getState();
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
      _store,
    );
  };

export const undoMiddleware = undoMiddlewareImpl as unknown as UndoMiddleware;

export default undoMiddleware;
