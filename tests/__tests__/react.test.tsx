import { describe, it, expect } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

describe('React Re-renders when state changes', () => {
  it('it', () => {
    const { queryByText, getByText } = render(
      <Reactive />,
    );

    expect(queryByText(/bears: 0/i)).toBeTruthy();
    expect(queryByText(/increment/i)).toBeTruthy();
    expect(queryByText(/past states: \[\]/i)).toBeTruthy();
    expect(queryByText(/future states: \[\]/i)).toBeTruthy();

    const incrementButton = getByText(/increment/i);
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);

    expect(queryByText(/bears: 2/i)).toBeTruthy();
    expect(
      queryByText(/past states: \[{"bears":0},{"bears":1}\]/i),
    ).toBeTruthy();
    expect(queryByText(/future states: \[\]/i)).toBeTruthy();

    expect(
      queryByText(/undo/i, {
        selector: 'button',
      }),
    ).toBeTruthy();

    const undoButton = getByText(/undo/i, {
      selector: 'button',
    });

    fireEvent.click(undoButton);
    fireEvent.click(undoButton);

    expect(queryByText(/bears: 0/i)).toBeTruthy();
    expect(queryByText(/past states: \[\]/i)).toBeTruthy();
    expect(
      queryByText(/future states: \[{"bears":2},{"bears":1}\]/i),
    ).toBeTruthy();
  });
});

// React Code from examples/web/pages/reactive.tsx
import { type TemporalState, temporal } from '../../src';
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
): U => {
  const state = useStore(useMyStore.temporal as any, selector);
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
  const undo = useTemporalStore((state) => state.undo);
  const redo = useTemporalStore((state) => state.redo);
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

const Reactive = () => {
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
