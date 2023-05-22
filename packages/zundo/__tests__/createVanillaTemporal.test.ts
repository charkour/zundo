import { describe, it, expect, vi } from 'vitest';
vi.mock('zustand');
import { temporalStateCreator } from '../src/temporal';
import { createStore } from 'zustand';
import { act } from 'react-dom/test-utils';
import { persist } from 'zustand/middleware';
import { temporal } from '../src';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

// tests the temporalStateCreator function rather than the temporal middleware
// Not exhaustive, but also likely not needed
describe('temporalStateCreator', () => {
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

  it('should have the objects defined', () => {
    const temporalStore = temporalStateCreator(
      store.setState,
      store.getState,
      store,
    );
    const { undo, redo, clear, pastStates, futureStates } = createStore(temporalStore).getState()

    expect(undo).toBeDefined();
    expect(redo).toBeDefined();
    expect(clear).toBeDefined();
    expect(pastStates).toBeDefined();
    expect(futureStates).toBeDefined();

    expect(store.getState().count).toBe(0);
    act(store.getState().increment);
    expect(store.getState().count).toBe(1);
  });
});
