import createVanilla, {
  GetState,
  SetState,
  State,
  StateCreator,
  StoreApi,
} from 'zustand/vanilla';
import create from 'zustand';

// use immer patches? https://immerjs.github.io/immer/patches/

interface UndoStoreState extends State {
  prevStates: any[];
  futureStates: any[];
  undo: () => void;
  redo: () => void;
  setStore: Function;
  getStore: Function;
}

// Stores previous actions
const undoStore = createVanilla<UndoStoreState>((_, get) => {
  return {
    prevStates: [],
    undo: () => {
      const { prevStates, futureStates, setStore, getStore } = get();
      if (prevStates.length > 0) {
        futureStates.push(getStore());
        const prevState = prevStates.pop();
        setStore(prevState);
      }
    },
    setStore: () => {},
    getStore: () => {},
    futureStates: [],
    redo: () => {
      const { prevStates, futureStates, setStore, getStore } = get();
      if (futureStates.length > 0) {
        prevStates.push(getStore());
        const futureState = futureStates.pop();
        setStore(futureState);
      }
    },
  };
});
const { getState, setState } = undoStore;
export const useUndo = create(undoStore);

// custom middleware to get previous state
export const undo = <TState extends State>(config: StateCreator<TState>) => (
  set: SetState<TState>,
  get: GetState<TState>,
  api: StoreApi<TState>
) =>
  config(
    args => {
      setState({
        prevStates: [...getState().prevStates, { ...get() }],
        setStore: set,
        futureStates: [],
        getStore: get,
      });
      set(args);
    },
    get,
    api
  );
