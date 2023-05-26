import { Button } from 'ui';
import { temporal } from 'zundo';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

// const withZundo = zundo<MyState>(
//   (set) => ({
//     count: 0,
//     increment: () => set((state) => ({ count: state.count + 1 })),
//     decrement: () => set((state) => ({ count: state.count - 1 })),
//   }),
//   {
//     handleSet: (handleSet) =>
//       throttle<typeof handleSet>((state) => {
//         console.error('handleSet called');
//         handleSet(state);
//       }, 1000),
//   },
// );

// TODO: doing this one by one does not work with the types.
// const withPersist = persist(withZundo);

// const originalStore = createVanilla(withZundo);

// const useStore = create(originalStore);

const useChainedStore = create<MyState>()(
  devtools(
    temporal(
      immer(
        persist(
          (set) => ({
            count: 0,
            increment: () => set((state) => ({ count: state.count + 1 })),
            decrement: () => set((state) => ({ count: state.count - 1 })),
          }),
          {
            name: 'test',
          },
        ),
      ),
    ),
  ),
);

export default function Web() {
  const { count, increment, decrement } = useChainedStore();
  const { undo, futureStates, pastStates } =
    useChainedStore.temporal.getState();

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
