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
  clear: () => void;
  setStore: Function;
  getStore: Function;
}

// factory to create undoStore
const createUndoStore = () => {
  return createVanilla<UndoStoreState>((set, get) => {
    return {
      prevStates: [],
      futureStates: [],
      undo: () => {
        const { prevStates, futureStates, setStore, getStore } = get();
        if (prevStates.length > 0) {
          futureStates.push(getStore());
          const prevState = prevStates.pop();
          setStore(prevState);
        }
      },
      redo: () => {
        const { prevStates, futureStates, setStore, getStore } = get();
        if (futureStates.length > 0) {
          prevStates.push(getStore());
          const futureState = futureStates.pop();
          setStore(futureState);
        }
      },
      clear: () => {
        set({ prevStates: [], futureStates: [] });
      },
      setStore: () => {},
      getStore: () => {},
    };
  });
}

// Stores previous actions
const undoStore = createUndoStore()
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
