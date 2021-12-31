import createVanilla, { GetState } from 'zustand/vanilla';
import { Options } from './types';
import { filterState } from './utils';

// use immer patches? https://immerjs.github.io/immer/patches/

export interface UndoStoreState {
  prevStates: any[];
  futureStates: any[];
  isUndoHistoryEnabled: boolean;

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
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
  steps?: number,
) => {
  const { prevStates, futureStates, setStore, getStore, options } = get();

  const actionSteps = steps || 1;
  const isUndo = action === 'undo';
  const currentActionStates = isUndo ? prevStates : futureStates;
  const otherActionStates = isUndo ? futureStates : prevStates;
  const limit = options?.historyDepthLimit;

  if (currentActionStates.length > 0) {
    if (limit) {
      for (let i = 0; i < actionSteps; i += 1) {
        // check history limit
        if (otherActionStates.length >= limit) {
          // pop front
          otherActionStates.shift();
        }
      }
    }
    otherActionStates.push(filterState(getStore(), options));
    for (let i = 0; i < actionSteps - 1; i += 1) {
      const stateIndex = currentActionStates.length - (i + 1);
      if (stateIndex > 0 && stateIndex < currentActionStates.length) {
        otherActionStates.push(currentActionStates[stateIndex]);
      }
    }
    let currentStoreState;
    for (let i = 0; i < actionSteps; i += 1) {
      const state = currentActionStates.pop();
      if (state !== undefined) {
        currentStoreState = state;
      }
    }
    setStore(currentStoreState);
  }
};

// factory to create undoStore. contains memory about past and future states and has methods to traverse states
export const createUndoStore = () =>
  createVanilla<UndoStoreState>((set, get) => ({
    prevStates: [],
    futureStates: [],
    isUndoHistoryEnabled: true,
    undo: (steps?: number) => {
      const { coolOffTimer } = get();

      // Clear cool off if user clicks "undo" during cool-off period
      if (coolOffTimer) clearTimeout(coolOffTimer);
      set({
        isCoolingOff: false,
      });

      handleStoreUpdates(get, 'undo', steps);
    },
    redo: (steps?: number) => {
      handleStoreUpdates(get, 'redo', steps);
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
