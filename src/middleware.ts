import {
  GetState,
  SetState,
  State,
  StateCreator,
  StoreApi,
} from 'zustand/vanilla';
import isEqual from 'lodash.isequal';
import { createUndoStore, UndoStoreState } from './factory';
import { filterState } from './utils';
import { Options } from './types';

// TODO: can we make this not a partial?
export type UndoState<UserState extends State> = Partial<{
  zundo: Pick<
    UndoStoreState<UserState>,
    'undo' | 'redo' | 'clear' | 'setIsUndoHistoryEnabled'
  > & { getState: GetState<UndoStoreState<UndoState<UserState> & UserState>> };
}>;

// custom zustand middleware to get previous state
export const undoMiddleware = <
  UserState extends State,
  UserStateWithUndo extends UndoState<UserState> &
    UserState = UndoState<UserState> & UserState,
>(
  config: StateCreator<UserStateWithUndo>,
  options: Options = {},
) => {
  const userConfig = (
    set: SetState<UserStateWithUndo>,
    get: GetState<UserStateWithUndo>,
    api: StoreApi<UserStateWithUndo>,
  ) => {
    const undoStore = createUndoStore<UserStateWithUndo>();
    const { getState, setState } = undoStore;
    const {
      undo,
      clear,
      redo,
      setIsUndoHistoryEnabled,
      isUndoHistoryEnabled,
      isCoolingOff,
      coolOffTimer,
    } = getState();

    const userReturn = config(
      (...args) => {
        /* TODO: const, should call this function and inject the values once, but it does
      it on every action call currently. */
        // inject helper functions to user defined store.
        const { zundo } = get();
        if (!zundo) {
          set({
            zundo: {
              undo,
              clear,
              redo,
              getState: getState as unknown as GetState<
                UndoStoreState<UndoState<UserState> & UserState>
              >,
              setIsUndoHistoryEnabled,
            },
          });
        }

        // Get the last state before updating state
        const lastState = filterState({ ...get() }, options);

        set(...args);

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

    return userReturn;
  };

  return userConfig;
};

export default undoMiddleware;
