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
const undoStore = createVanilla<UndoStoreState>((_, get) => ({
  prevStates: [],
  undo: () => {
    const prevState = get().prevStates.pop();
    get().futureStates.push(get().getStore());
    get().setStore(prevState);
  },
  setStore: () => {},
  getStore: () => {},
  futureStates: [],
  redo: () => {
    const futureState = get().futureStates.pop();
    get().prevStates.push(get().getStore());
    get().setStore(futureState);
  },
}));
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
