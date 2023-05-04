import { temporal } from 'zundo';
import create from 'zustand';

interface MyState {
  bears: number;
  bees: number;
  increment: () => void;
  decrement: () => void;
  incrementBees: () => void;
  decrementBees: () => void;
}

const useStore = create(
  temporal<MyState>(
    (set) => ({
      bears: 0,
      bees: 10,
      increment: () => set((state) => ({ bears: state.bears + 1 })),
      decrement: () => set((state) => ({ bears: state.bears - 1 })),
      incrementBees: () => set((state) => ({ bees: state.bees + 1 })),
      decrementBees: () => set((state) => ({ bees: state.bees - 1 })),
    }),
    {
      wrapTemporal: (config) => {
        const thing: typeof config = (_set, get, store) => {
          const set: typeof _set = (partial, replace) => {
            console.info('handleSet called');
            console.log(
              'calling wrapped setter',
              JSON.stringify(partial, null, 2),
            );
            _set(partial, replace);
          };
          return config(set, get, store);
        };
        return thing;
      },
    },
  ),
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

const StateBear = () => {
  const store = useStore((state) => ({
    bears: state.bears,
    increment: state.increment,
    decrement: state.decrement,
  }));
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

const StateBee = () => {
  const store = useStore();
  console.log(store);
  const { bees, increment, decrement } = store;
  return (
    <div>
      current state: {JSON.stringify(store)}
      <br />
      <br />
      bees: {bees}
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
      <StateBear />
      <StateBee />
      <br />
      <UndoBar />
    </div>
  );
};

export default App;