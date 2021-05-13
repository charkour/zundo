import createVanilla, {
  GetState,
  SetState,
  StateCreator,
  StoreApi,
} from 'zustand/vanilla';

// use immer patches? https://immerjs.github.io/immer/patches/

interface UndoStoreState {
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
};

export type UndoState = Partial<
  Pick<UndoStoreState, 'undo' | 'redo' | 'clear'> & { getState: () => UndoStoreState }
>;

// custom middleware to get previous state
export const undoMiddleware = <TState extends UndoState>(
  config: StateCreator<TState>
) => (set: SetState<TState>, get: GetState<TState>, api: StoreApi<TState>) => {
  const undoStore = createUndoStore();
  const { getState, setState} = undoStore;
  return config(
    args => {
      setState({
        prevStates: [...getState().prevStates, { ...get() }],
        setStore: set,
        futureStates: [],
        getStore: get,
      });
      // TODO: const, should call this function and inject the values once, but it does
      // it on every action call currently.
      const { undo, clear, redo } = getState();
      set({
        undo,
        clear,
        redo,
        getState,
      });

      set(args);
    },
    get,
    api
  );
};


