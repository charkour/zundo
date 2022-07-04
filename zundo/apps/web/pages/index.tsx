import { Button } from 'ui';
import { zundo } from 'zundo';
import create from 'zustand';
import createVanilla from 'zustand/vanilla';

interface State {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const withZundo = zundo<State>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

const originalStore = createVanilla(withZundo);

const useStore = create(originalStore);

export default function Web() {
  const store = useStore();
  const temporal = useStore.temporal;
  const { getState } = temporal;
  const { futureStates, pastStates, undo } = getState();
  const { count, increment, decrement } = store;

  return (
    <div>
      <h1>Web</h1>
      <div>
        <button onClick={increment}>+</button>
        <button onClick={decrement}>-</button>
        <span>{count}</span>
        <div>
          <h2>Future States</h2>
          {JSON.stringify(futureStates)}
          <h2>Previous States</h2>
          {JSON.stringify(pastStates)}
          <button onClick={undo}>Undo</button>
        </div>
      </div>
      <Button />
    </div>
  );
}
