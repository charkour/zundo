import { describe, it, expect, vi } from 'vitest';
vi.mock('zustand/vanilla');
import { createTemporalStore } from '../../temporal';
import createVanilla from 'zustand/vanilla';
import { act } from 'react-dom/test-utils';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

describe('Temporal', () => {
  const store = createVanilla<MyState>((set) => {
    return {
      count: 0,
      increment: () =>
        set((state) => ({
          count: state.count + 1
        })),
      decrement: () =>   set((state) => ({
        count: state.count - 1
      })),
    };
  });

  it('should work', () => {
    const temporalStore = createTemporalStore(store.setState, store.getState);
    const { undo, redo, clear, pastStates, futureStates } =
      temporalStore.getState();
    expect(undo).toBeDefined();
    expect(redo).toBeDefined();
    expect(clear).toBeDefined();
    expect(pastStates).toBeDefined();
    expect(futureStates).toBeDefined();

    expect(store.getState().count).toBe(0);
    act(() => {
      store.getState().increment();
    });
    expect(store.getState().count).toBe(1);
  });

  it('should work', () => {
    expect(store.getState().count).toBe(0);
  });
});
