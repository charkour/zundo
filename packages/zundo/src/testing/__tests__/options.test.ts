import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('zustand/vanilla');
import { Write, zundo } from '../../index';
import createVanilla, { StoreApi } from 'zustand/vanilla';
import { act } from 'react-dom/test-utils';
import { TemporalState, ZundoOptions } from '../../temporal';

interface MyState {
  count: number;
  count2: number;
  increment: () => void;
  decrement: () => void;
}

const createStore = (options?: ZundoOptions<MyState>) => {
  return createVanilla<MyState>()(
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
        ...options,
      },
    ),
  );
};

describe('Middleware options', () => {
  let store: Write<
    StoreApi<MyState>,
    {
      temporal: StoreApi<
        TemporalState<{
          count: number;
        }>
      >;
    }
  >;
  // Recreate store for each test
  beforeEach(() => {
    store = createStore();
  });

  describe('partialize', () => {
    it('should partialize the past states', () => {
      const { undo, redo, clear, pastStates, futureStates } =
        store.temporal.getState();
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
      const { undo, redo, clear, pastStates, futureStates } =
        store.temporal.getState();
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
      expect(store.getState()).toEqual({
        count: 1,
        count2: 2,
        increment: expect.any(Function),
        decrement: expect.any(Function),
      });
      act(() => {
        undo();
      });
      expect(futureStates.length).toBe(2);
      expect(futureStates[1]).toEqual({
        count: 1,
      });
      expect(store.getState()).toEqual({
        count: 0,
        count2: 2,
        increment: expect.any(Function),
        decrement: expect.any(Function),
      });
    });
  });

  describe('temporal state', () => {
    it('should initialize state to tracking', () => {
      const { state } = store.temporal.getState();
      expect(state).toBe('tracking');
    });

    it('should switch to paused', () => {
      const { pause } = store.temporal.getState();
      act(() => {
        pause();
      });
      expect(store.temporal.getState().state).toBe('paused');
    });

    it('should switch to tracking', () => {
      const { resume, pause } = store.temporal.getState();
      act(() => {
        pause();
        resume();
      });
      expect(store.temporal.getState().state).toBe('tracking');
    });

    it('does not track state when paused', () => {
      const { pause, resume } = store.temporal.getState();
      act(() => {
        pause();
        store.getState().increment();
      });
      expect(store.temporal.getState().pastStates.length).toBe(0);
      act(() => {
        resume();
        store.getState().increment();
      });
      expect(store.temporal.getState().pastStates.length).toBe(1);
      expect(store.temporal.getState().pastStates[0]).toEqual({
        count: 1,
      });
      expect(store.getState()).toContain({ count: 2, count2: 2 });
    });
  });

  describe('limit', () => {
    it('should not limit the number of past states when not set', () => {
      const { increment } = store.getState();
      act(() => {
        increment();
        increment();
        increment();
        increment();
        increment();
      });
      expect(store.temporal.getState().pastStates.length).toBe(5);
      expect(store.temporal.getState().pastStates[0]).toEqual({
        count: 0,
      });
      expect(store.temporal.getState().pastStates[2]).toEqual({
        count: 2,
      });
    });

    it('should limit the number of past states when set', () => {
      const storeWithLimit = createStore({ limit: 3 });
      const { increment } = storeWithLimit.getState();
      act(() => {
        increment();
        increment();
        increment();
        increment();
        increment();
      });
      console.log(storeWithLimit.temporal.getState().pastStates.length);
      expect(storeWithLimit.temporal.getState().pastStates.length).toBe(3);
      expect(storeWithLimit.temporal.getState().pastStates[0]).toEqual({
        count: 2,
      });
      expect(storeWithLimit.temporal.getState().pastStates[2]).toEqual({
        count: 4,
      });
    });
  });
});
