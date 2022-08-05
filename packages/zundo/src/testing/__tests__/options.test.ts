import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('zustand/vanilla');
import { Write, zundo } from '../../index';
import createVanilla, { StoreApi } from 'zustand/vanilla';
import { act } from 'react-dom/test-utils';
import { TemporalState, ZundoOptions } from '../../temporal';
import shallow from 'zustand/shallow';

interface MyState {
  count: number;
  count2: number;
  increment: () => void;
  decrement: () => void;
  doNothing: () => void;
}

const createStore = (
  options?: ZundoOptions<MyState, Pick<MyState, 'count'>>,
) => {
  return createVanilla<MyState>()(
    zundo((set) => {
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
        doNothing: () => set((state) => ({ ...state })),
      };
    }, options),
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
    it('should not partialize by default', () => {
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
        count2: 0,
        increment: expect.any(Function),
        decrement: expect.any(Function),
        doNothing: expect.any(Function),
      });
      expect(pastStates[1]).toEqual({
        count: 1,
        count2: 1,
        increment: expect.any(Function),
        decrement: expect.any(Function),
        doNothing: expect.any(Function),
      });
      expect(store.getState()).toContain({ count: 2, count2: 2 });
    });

    it('should partialize the past states', () => {
      const storeWithPartialize = createStore({
        partialize: (state) => ({
          count: state.count,
        }),
      });
      const { undo, redo, clear, pastStates, futureStates } =
        storeWithPartialize.temporal.getState();
      expect(pastStates.length).toBe(0);
      expect(futureStates.length).toBe(0);
      act(() => {
        storeWithPartialize.getState().increment();
        storeWithPartialize.getState().increment();
      });
      expect(pastStates.length).toBe(2);
      expect(pastStates[0]).toEqual({
        count: 0,
      });
      expect(pastStates[1]).toEqual({
        count: 1,
      });
      expect(storeWithPartialize.getState()).toContain({ count: 2, count2: 2 });
    });

    it('should partialize the future states', () => {
      const storeWithPartialize = createStore({
        partialize: (state) => ({
          count: state.count,
        }),
      });
      const { undo, redo, clear, pastStates, futureStates } =
        storeWithPartialize.temporal.getState();
      expect(pastStates.length).toBe(0);
      expect(futureStates.length).toBe(0);

      act(() => {
        storeWithPartialize.getState().increment();
        storeWithPartialize.getState().increment();
        undo();
      });
      expect(futureStates.length).toBe(1);
      expect(futureStates[0]).toEqual({
        count: 2,
      });
      expect(storeWithPartialize.getState()).toEqual({
        count: 1,
        count2: 2,
        increment: expect.any(Function),
        decrement: expect.any(Function),
        doNothing: expect.any(Function),
      });
      act(() => {
        undo();
      });
      expect(futureStates.length).toBe(2);
      expect(futureStates[1]).toEqual({
        count: 1,
      });
      expect(storeWithPartialize.getState()).toEqual({
        count: 0,
        count2: 2,
        increment: expect.any(Function),
        decrement: expect.any(Function),
        doNothing: expect.any(Function),
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
      expect(store.getState()).toContain({ count: 1, count2: 1 });
      act(() => {
        resume();
        store.getState().increment();
      });
      expect(store.temporal.getState().pastStates.length).toBe(1);
      expect(store.temporal.getState().pastStates[0]).toContain({
        count: 1,
        count2: 1,
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
      expect(store.temporal.getState().pastStates[0]).toContain({
        count: 0,
      });
      expect(store.temporal.getState().pastStates[2]).toContain({
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
      expect(storeWithLimit.temporal.getState().pastStates.length).toBe(3);
      expect(storeWithLimit.temporal.getState().pastStates[0]).toContain({
        count: 2,
      });
      expect(storeWithLimit.temporal.getState().pastStates[2]).toContain({
        count: 4,
      });
    });
  });

  describe('equality function', () => {
    it('should use the equality function when set', () => {
      const storeWithEquality = createStore({
        equality: (state1, state2) => state1.count === state2.count,
      });
      const { doNothing, increment } = storeWithEquality.getState();
      act(() => {
        doNothing();
        doNothing();
      });
      expect(storeWithEquality.temporal.getState().pastStates.length).toBe(0);
      act(() => {
        increment();
        doNothing();
      });
      expect(storeWithEquality.temporal.getState().pastStates.length).toBe(1);
      act(() => {
        doNothing();
        increment();
      });
      expect(storeWithEquality.temporal.getState().pastStates.length).toBe(2);
    });

    it('should use an external equality function', () => {
      const storeWithEquality = createStore({
        equality: shallow,
      });
      const { doNothing, increment } = storeWithEquality.getState();
      act(() => {
        doNothing();
        doNothing();
      });
      expect(storeWithEquality.temporal.getState().pastStates.length).toBe(0);
      act(() => {
        increment();
        doNothing();
      });
      expect(storeWithEquality.temporal.getState().pastStates.length).toBe(1);
      act(() => {
        doNothing();
        increment();
      });
      expect(storeWithEquality.temporal.getState().pastStates.length).toBe(2);
    });

    it('should not prevent history if there is no equality function', () => {
      const { doNothing, increment } = store.getState();
      act(() => {
        doNothing();
        doNothing();
      });
      expect(store.temporal.getState().pastStates.length).toBe(2);
      act(() => {
        increment();
        doNothing();
      });
      expect(store.temporal.getState().pastStates.length).toBe(4);
      act(() => {
        doNothing();
        increment();
      });
      expect(store.temporal.getState().pastStates.length).toBe(6);
    })
  });
});
