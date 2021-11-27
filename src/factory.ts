import createVanilla, { GetState } from 'zustand/vanilla';
import { Options } from './types';
import { filterState } from './utils';

// use immer patches? https://immerjs.github.io/immer/patches/

export interface UndoStoreState {
  prevStates: any[];
  futureStates: any[];
  isUndoHistoryEnabled: boolean;

  undo: () => void;
  redo: () => void;
  clear: () => void;
  setIsUndoHistoryEnabled: (isEnabled: boolean) => void;
  // handle on the parent store's setter
  setStore: Function;
  // handle on the parent store's getter
  getStore: Function;
  options?: Options;
  coolOffTimer?: number;
  isCoolingOff?: boolean;
}

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
    otherActionStates.push(filterState(getStore(), options?.omit));
    const currentStoreState = currentActionStates.pop();
    setStore(currentStoreState);
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
      const currState = filterState(getStore(), options?.omit);

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
