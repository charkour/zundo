import throttle from 'lodash.throttle';
import { Button } from 'ui';
import { temporal, type TemporalState } from 'zundo';
import { useStore, createStore } from 'zustand';
import { shallow } from 'zustand/shallow';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const withZundo = temporal<MyState>(
  (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
  }),
  {
    handleSet: (handleSet) =>
      throttle<typeof handleSet>((state) => {
        console.info('handleSet called');
        handleSet(state);
      }, 1000),
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

export default function Web() {
  const { count, increment, decrement } = useBaseStore((state) => state);
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
        <div>
          <h2>Future States</h2>
          <div>{JSON.stringify(futureStates)}</div>
          <h2>Previous States</h2>
          <div>{JSON.stringify(pastStates)}</div>
          <button onClick={() => undo()}>Undo</button>
        </div>
      </div>
      <Button />
    </div>
  );
}
