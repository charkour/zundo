import { temporal, type TemporalState } from 'zundo';
import { useStore, createStore } from 'zustand';
import { shallow } from 'zustand/shallow';
import diff from 'microdiff';

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
    equality: shallow,
    diff: (state, prevState) => {
      const myDiff = diff(prevState, state);
      const newStateFromDiff = myDiff.reduce((acc, difference) => {
        const { type, path } = difference;
        if (type === 'CREATE') {
          const { value } = difference;
          return { ...acc, [path]: value };
        }
        if (type === 'REMOVE') {
          const { [path]: _, ...rest } = acc;
          return rest;
        }
        if (type === 'CHANGE') {
          const { value } = difference;
          return { ...acc, [path]: value };
        }
        return acc;
      }, {});
      return isEmpty(newStateFromDiff) ? undefined : newStateFromDiff;
    },
  },
);

const originalStore = createStore(withZundo);

const useBaseStore = <T,>(
  selector: (state: MyState) => T,
  equality?: (a: T, b: T) => boolean,
) => useStore(originalStore, selector, equality);
const useTemporalStore = <T,>(
  selector: (state: TemporalState<MyState>) => T,
  equality?: (a: T, b: T) => boolean,
) => useStore(originalStore.temporal, selector, equality);

const isEmpty = (obj: object) => {
  for (const _ in obj) {
    return false;
  }
  return true;
};

export default function Web() {
  const { count, increment, decrement, count2, increment2, decrement2, doNothing } =
    useBaseStore((state) => state);
  const { futureStates, pastStates, undo } = useTemporalStore(
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
        </div>
      </div>
    </div>
  );
}
