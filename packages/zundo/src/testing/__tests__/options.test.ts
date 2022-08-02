import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('zustand/vanilla');
import { Write, zundo } from '../../index';
import createVanilla, { StoreApi } from 'zustand/vanilla';
import { act } from 'react-dom/test-utils';
import { Temporal } from '../../temporal';

interface MyState {
  count: number;
  count2: number;
  increment: () => void;
  decrement: () => void;
}

describe('Middleware options', () => {
  let store: Write<
    StoreApi<MyState>,
    {
      temporal: Temporal<{
        count: number;
      }>;
    }
  >;
  // Recreate store for each test
  beforeEach(() => {
    store = createVanilla<MyState>()(
      zundo(
        (set) => {
          return {
            count: 0,
            count2: 0,
            increment: () =>
              set((state) => ({
                count: state.count + 1,
                count2: state.count2 + 1,
              })),
            decrement: () =>
              set((state) => ({
                count: state.count - 1,
                count2: state.count2 - 1,
              })),
          };
        },
        {
          partialize: (state) => ({
            count: state.count,
          }),
        },
      ),
    );
  });

  describe('partialize', () => {
    it('should partialize the past states', () => {
      const { undo, redo, clear, pastStates, futureStates } = store.temporal;
      expect(pastStates.length).toBe(0);
      expect(futureStates.length).toBe(0);
      act(() => {
        store.getState().increment();
        store.getState().increment();
      });
      expect(pastStates.length).toBe(2);
      expect(pastStates[0]).toEqual({
        count: 0,
      });
      expect(pastStates[1]).toEqual({
        count: 1,
      });
      expect(store.getState()).toContain({ count: 2, count2: 2 });
    });

    it('should partialize the future states', () => {
      const { undo, redo, clear, pastStates, futureStates } = store.temporal;
      expect(pastStates.length).toBe(0);
      expect(futureStates.length).toBe(0);

      act(() => {
        store.getState().increment();
        store.getState().increment();
        undo();
      });
      expect(futureStates.length).toBe(1);
      expect(futureStates[0]).toEqual({
        count: 2,
      });
      expect(store.getState()).toEqual({ count: 1, count2: 2, increment: expect.any(Function), decrement: expect.any(Function) });
      act(() => {
        undo();
      });
      expect(futureStates.length).toBe(2);
      expect(futureStates[1]).toEqual({
        count: 1,
      });
      expect(store.getState()).toEqual({ count: 0, count2: 2, increment: expect.any(Function), decrement: expect.any(Function) });
    });
  });
});
