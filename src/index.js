
import createVanilla from "zustand/vanilla";
import create from "zustand";

// original implementation
// https://stackblitz.com/edit/react-bcql2z

// use immer patches? https://immerjs.github.io/immer/patches/

// Stores previous actions
const undoStore = createVanilla((set, get) => ({
  prevActions: [],
  undo: () => {
    get().handle(get().prevActions.pop());
  },
  handle: undefined
}));
const { getState, setState, subscribe, destroy } = undoStore;
export const useUndo = create(undoStore);

// custom middleware to get previous state
export const undo = config => (set, get, api) =>
  config(
    args => {
      setState({
        prevActions: [...getState().prevActions, { ...get() }],
        handle: set
      });
      set(args);
      console.log("  new state", get());
    },
    get,
    api
  );