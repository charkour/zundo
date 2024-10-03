import { type TemporalState, temporal } from 'zundo';
import { type StoreApi, useStore, create } from 'zustand';

interface MyState {
  bears: number;
  increment: () => void;
  decrement: () => void;
}

const useMyStore = create(
  temporal<MyState>((set) => ({
    bears: 0,
    increment: () => set((state) => ({ bears: state.bears + 1 })),
    decrement: () => set((state) => ({ bears: state.bears - 1 })),
  })),
);

type ExtractState<S> = S extends {
  getState: () => infer T;
}
  ? T
  : never;
type ReadonlyStoreApi<T> = Pick<StoreApi<T>, 'getState' | 'subscribe'>;
type WithReact<S extends ReadonlyStoreApi<unknown>> = S & {
  getServerState?: () => ExtractState<S>;
};

const useTemporalStore = <
  S extends WithReact<StoreApi<TemporalState<MyState>>>,
  U,
>(
  selector: (state: ExtractState<S>) => U,
  equality?: (a: U, b: U) => boolean,
): U => {
  const state = useStore(useMyStore.temporal as any, selector, equality);
  return state;
};

const HistoryBar = () => {
  const futureStates = useTemporalStore((state) => state.futureStates);
  const pastStates = useTemporalStore((state) => state.pastStates);
  return (
    <div>
      past states: {JSON.stringify(pastStates)}
      <br />
      future states: {JSON.stringify(futureStates)}
      <br />
    </div>
  );
};

const UndoBar = () => {
  const { undo, redo } = useTemporalStore((state) => ({
    undo: state.undo,
    redo: state.redo,
  }));
  return (
    <div>
      <button onClick={() => undo()}>undo</button>
      <button onClick={() => redo()}>redo</button>
    </div>
  );
};

const StateBar = () => {
  const store = useMyStore();
  const { bears, increment, decrement } = store;
  return (
    <div>
      current state: {JSON.stringify(store)}
      <br />
      <br />
      bears: {bears}
      <br />
      <button onClick={increment}>increment</button>
      <button onClick={decrement}>decrement</button>
    </div>
  );
};

const App = () => {
  return (
    <div>
      <h1>
        {' '}
        <span role="img" aria-label="bear">
          🐻
        </span>{' '}
        <span role="img" aria-label="recycle">
          ♻️
        </span>{' '}
        Zundo!
      </h1>
      <StateBar />
      <br />
      <UndoBar />
      <HistoryBar />
    </div>
  );
};

export default App;
