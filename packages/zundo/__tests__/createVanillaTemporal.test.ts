import { describe, it, expect, vi } from 'vitest';
vi.mock('zustand');
import { createVanillaTemporal } from '../src/temporal';
import { createStore } from 'zustand';
import { act } from 'react-dom/test-utils';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

// tests the createVanillaTemporal function rather than the temporal middleware
// Not exhaustive, but also likely not needed
describe('createVanillaTemporal', () => {
  const store = createStore<MyState>((set) => {
    return {
      count: 0,
      increment: () =>
        set((state) => ({
          count: state.count + 1,
        })),
      decrement: () =>
        set((state) => ({
          count: state.count - 1,
        })),
    };
  });

  const temporalStore = createVanillaTemporal(store.setState, store.getState);
  const { undo, redo, clear, pastStates, futureStates } =
    temporalStore.getState();
  it('should have the objects defined', () => {
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
});
