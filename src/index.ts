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
  undo: () => void;
  handle: Function;
}

// Stores previous actions
const undoStore = createVanilla<UndoStoreState>((_, get) => ({
  prevStates: [],
  undo: () => {
    get().handle(get().prevStates.pop());
  },
  handle: () => {},
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
        handle: set,
      });
      set(args);
      console.log('  new state', get());
    },
    get,
    api
  );
