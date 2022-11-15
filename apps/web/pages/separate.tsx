import { temporal } from "zundo";
import create from "zustand";

interface MyState {
  bears: number;
  increment: () => void;
  decrement: () => void;
}

const useStore = create(
  temporal<MyState>((set) => ({
    bears: 0,
    increment: () => set((state) => ({ bears: state.bears + 1 })),
    decrement: () => set((state) => ({ bears: state.bears - 1 })),
  })),
);
const useTemporalStore = create(useStore.temporal);

const UndoBar = () => {
  const { undo, redo, futureStates, pastStates } = useTemporalStore();
  return (
    <div>
      past states: {JSON.stringify(pastStates)}
      <br />
      future states: {JSON.stringify(futureStates)}
      <br />
      <button onClick={() => undo()} disabled={!pastStates.length}>
        undo
      </button>
      <button onClick={() => redo()} disabled={!futureStates.length}>
        redo
      </button>
    </div>
  );
};

const StateBar = () => {
  const store = useStore();
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
        {" "}
        <span role="img" aria-label="bear">
          🐻
        </span>{" "}
        <span role="img" aria-label="recycle">
          ♻️
        </span>{" "}
        Zundo!
      </h1>
      <StateBar />
      <br />
      <UndoBar />
    </div>
  );
};

export default App;