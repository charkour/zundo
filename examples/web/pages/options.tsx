import { temporal, type TemporalState } from 'zundo';
import { create } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import deepEqual from 'fast-deep-equal';
import throttle from 'just-throttle';
import './styles.css';

interface MyState {
  bears: number;
  untrackedValue: number;
  increment: () => void;
  decrement: () => void;
  incrementUntrackedValue: () => void;
}

type HistoryTrackedState = Omit<MyState, 'untrackedValue'>;

const useMyStore = create<MyState>()(
  temporal(
    (set) => ({
      bears: 0,
      untrackedValue: 0,
      increment: () => set((state) => ({ bears: state.bears + 1 })),
      decrement: () => set((state) => ({ bears: state.bears - 1 })),
      incrementUntrackedValue: () =>
        set((state) => ({ untrackedValue: state.untrackedValue + 1 })),
    }),
    {
      equality: deepEqual,
      handleSet: (handleSet) =>
        throttle<typeof handleSet>((...args) => {
          handleSet(...args);
        }, 500),
      partialize: (state): HistoryTrackedState => {
        const { untrackedValue, ...trackedValues } = state;
        return { ...trackedValues };
      },
    },
  ),
);

const useTemporalStore = <T,>(
  selector: (state: TemporalState<HistoryTrackedState>) => T,
  equality?: (a: T, b: T) => boolean,
) => useStoreWithEqualityFn(useMyStore.temporal, selector, equality);

const App = () => {
  const store = useMyStore();
  const { bears, increment, decrement, incrementUntrackedValue } = store;
  const { undo, redo, clear, futureStates, pastStates } = useTemporalStore(
    (state) => state,
  );

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
      <h2>
        With config options: <br />
        partialize, handleSet, equality
      </h2>
      <p>The throttle value is set to 500ms.</p>
      <p>untrackedValue is not tracked in history (partialize)</p>
      <p>equality function is fast-deep-equal</p>
      <p>
        Note that clicking the button that increments untrackedValue prior to
        incrementing bears results in state history of bears not being tracked
      </p>
      <button
        onClick={() => {
          increment();
          incrementUntrackedValue();
        }}
      >
        increment bears then increment untrackedValue
      </button>
      <br /> <br />
      <button
        onClick={() => {
          incrementUntrackedValue();
          increment();
        }}
      >
        increment untrackedValue then increment bears
      </button>
      <br /> <br />
      <button onClick={decrement}>decrement bears</button>
      <br />
      <button onClick={() => undo()}>undo</button>
      <button onClick={() => redo()}>redo</button>
      <button onClick={() => clear()}>clear</button>
      <br /> <br />
      past states: {JSON.stringify(pastStates)}
      <br />
      future states: {JSON.stringify(futureStates)}
      <br />
      current state: {JSON.stringify(store)}
      <br />
      <br />
      bears: {bears}
      <br />
    </div>
  );
};

export default App;
