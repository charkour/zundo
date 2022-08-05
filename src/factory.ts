import createVanilla, { GetState } from 'zustand/vanilla';
import { UndoStoreState } from './types';
import { filterState } from './utils';

// use immer patches? https://immerjs.github.io/immer/patches/

const handleStoreUpdates = (
  get: GetState<UndoStoreState>,
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
    setStore(currentStoreState, false, action);
  }
};

// factory to create undoStore. contains memory about past and future states and has methods to traverse states
export const createUndoStore = () =>
  createVanilla<UndoStoreState>((set, get) => ({
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
      get().setStore();
    },
    setIsUndoHistoryEnabled: (isEnabled) => {
      const { prevStates, getStore, options } = get();
      const currState = filterState(getStore(), options);

      set({
        isUndoHistoryEnabled: isEnabled,
        prevStates: isEnabled ? prevStates : [...prevStates, currState],
      });
    },
    setStore: () => {},
    getStore: () => {},
    options: {},
    forceUpdate: () => {},
  }));
