import { temporal, type TemporalState } from 'zundo';
import { createStore } from 'zustand';
import { shallow } from 'zustand/shallow';
import diff from 'microdiff';
import { useStoreWithEqualityFn } from 'zustand/traditional';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
  count2: number;
  increment2: () => void;
  decrement2: () => void;
  doNothing: () => void;
}

const withZundo = temporal<MyState>(
  (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
    count2: 0,
    increment2: () => set((state) => ({ count2: state.count2 + 1 })),
    decrement2: () => set((state) => ({ count2: state.count2 - 1 })),
    doNothing: () => set((state) => state),
  }),
  {
    diff: (pastState, currentState) => {
      const myDiff = diff(currentState, pastState);
      const newStateFromDiff = myDiff.reduce(
        (acc, difference) => {
          type State = typeof currentState;
          type Key = keyof State;
          if (difference.type === 'CHANGE') {
            // 'count' | 'count2' | 'increment' | 'decrement' | 'increment2' | 'decrement2' | 'doNothing'
            const pathAsString = difference.path.join('.') as Key;
            // number | () => void | undefined
            const value = difference.value;
            acc[pathAsString] = value;
          }
          return acc;
        },
        {} as Partial<typeof currentState>,
      );
      return isEmpty(newStateFromDiff) ? null : newStateFromDiff;
    },
  },
);

const originalStore = createStore(withZundo);

const useBaseStore = <T,>(
  selector: (state: MyState) => T,
  equality?: (a: T, b: T) => boolean,
) => useStoreWithEqualityFn(originalStore, selector, equality);

function useTemporalStore(): TemporalState<MyState>;
function useTemporalStore<T>(selector: (state: TemporalState<MyState>) => T): T;
function useTemporalStore<T>(
  selector: (state: TemporalState<MyState>) => T,
  equality: (a: T, b: T) => boolean,
): T;
function useTemporalStore<T>(
  selector?: (state: TemporalState<MyState>) => T,
  equality?: (a: T, b: T) => boolean,
) {
  return useStoreWithEqualityFn(originalStore.temporal, selector!, equality);
}

const isEmpty = (obj: object) => {
  for (const _ in obj) {
    return false;
  }
  return true;
};

export default function Web() {
  const {
    count,
    increment,
    decrement,
    count2,
    increment2,
    decrement2,
    doNothing,
  } = useBaseStore((state) => state);
  const { futureStates, pastStates, undo, redo } = useTemporalStore(
    (state) => state,
    shallow,
  );

  return (
    <div>
      <h1>Web</h1>
      <div>
        <button onClick={increment}>+</button>
        <button onClick={decrement}>-</button>
        <span>{count}</span>
        <br />
        <button onClick={increment2}>+</button>
        <button onClick={decrement2}>-</button>
        <span>{count2}</span>
        <br />
        <button onClick={doNothing}>Do Nothing</button>
        <div>
          <h2>Future States</h2>
          <div>{JSON.stringify(futureStates)}</div>
          <h2>Previous States</h2>
          <div>{JSON.stringify(pastStates)}</div>
          <button onClick={() => undo()}>Undo</button>
          <button onClick={() => redo()}>Redo</button>
        </div>
      </div>
    </div>
  );
}
