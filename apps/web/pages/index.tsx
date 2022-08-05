import { Button } from 'ui';
import { zundo } from 'zundo';
import create from 'zustand';
import createVanilla from 'zustand/vanilla';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const withZundo = zundo<MyState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

const originalStore = createVanilla(withZundo);

const useStore = create(originalStore);

export default function Web() {
  const { count, increment, decrement } = useStore();
  const { undo, futureStates, pastStates } = useStore.temporal.getState();

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
