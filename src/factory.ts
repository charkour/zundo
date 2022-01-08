import createVanilla, { GetState, SetState, State } from 'zustand/vanilla';
import { Options } from './types';
import { filterState } from './utils';

// use immer patches? https://immerjs.github.io/immer/patches/

export interface UndoStoreState<UserStateWithUndo extends State> {
  prevStates: UserStateWithUndo[];
  futureStates: UserStateWithUndo[];
  isUndoHistoryEnabled: boolean;

  undo: () => void;
  redo: () => void;
  clear: () => void;
  setIsUndoHistoryEnabled: (isEnabled: boolean) => void;

  // reference to the parent store's setter
  setStore: SetState<UserStateWithUndo>;
  // reference to the parent store's getter
  getStore: GetState<UserStateWithUndo>;

  options: Options;

  coolOffTimer?: number;
  isCoolingOff?: boolean;
}

const handleStoreUpdates = <UserStateWithUndo extends State>(
  get: GetState<UndoStoreState<UserStateWithUndo>>,
  action: 'undo' | 'redo',
) => {
  const { prevStates, futureStates, setStore, getStore, options } = get();

  const isUndo = action === 'undo';
  const currentActionStates = isUndo ? prevStates : futureStates;
  const otherActionStates = isUndo ? futureStates : prevStates;
  const limit = options?.historyDepthLimit;

  if (currentActionStates.length > 0) {
    // check history limit
    if (limit && otherActionStates.length >= limit) {
      // pop front
      otherActionStates.shift();
    }
    otherActionStates.push(filterState(getStore(), options));
    const currentStoreState = currentActionStates.pop();
    if (currentStoreState) setStore(currentStoreState);
  }
};

// factory to create undoStore. contains memory about past and future states and has methods to traverse states
export const createUndoStore = <UserStateWithUndo extends State>() =>
  createVanilla<UndoStoreState<UserStateWithUndo>>((set, get) => ({
    prevStates: [],
    futureStates: [],
    isUndoHistoryEnabled: true,

    undo: () => {
      const { coolOffTimer } = get();
      // Clear cool off if user clicks "undo" during cool-off period
      if (coolOffTimer) clearTimeout(coolOffTimer);
      set({
        isCoolingOff: false,
      });

      handleStoreUpdates(get, 'undo');
    },
    redo: () => {
      handleStoreUpdates(get, 'redo');
    },

    clear: () => {
      set({ prevStates: [], futureStates: [] });
      get().setStore({});
    },

    setIsUndoHistoryEnabled: (isEnabled) => {
      const { prevStates, getStore, options } = get();
      const filteredCurrentState = filterState(getStore(), options);

      set({
        isUndoHistoryEnabled: isEnabled,
        prevStates: isEnabled
          ? prevStates
          : [...prevStates, filteredCurrentState],
      });
    },

    setStore: () => {},
    getStore: () => ({} as UserStateWithUndo),
    options: {},

    forceUpdate: () => {},
  }));
