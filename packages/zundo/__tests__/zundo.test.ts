import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('zustand');
import { temporal } from '../src/index';
import { createStore, type StoreApi } from 'zustand';
import { act } from 'react-dom/test-utils';
import type { TemporalState, Write } from '../src/types';

interface MyState {
  count: number;
  count2: number;
  increment: () => void;
  decrement: () => void;
}

describe('temporal middleware', () => {
  let store: Write<
    StoreApi<MyState>,
    {
      temporal: StoreApi<TemporalState<MyState>>;
    }
  >;
  // Recreate store for each test
  beforeEach(() => {
    store = createStore<MyState>()(
      temporal((set) => {
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
      }),
    );
  });

  it('should have the objects defined', () => {
    const {
      undo,
      redo,
      clear,
      pastStates,
      futureStates,
      trackingStatus,
      pause,
      resume,
      setOnSave,
    } = store.temporal.getState();
    expect(undo).toBeDefined();
    expect(redo).toBeDefined();
    expect(clear).toBeDefined();
    expect(pastStates).toBeDefined();
    expect(futureStates).toBeDefined();
    expect(trackingStatus).toBeDefined();
    expect(pause).toBeDefined();
    expect(resume).toBeDefined();
    expect(setOnSave).toBeDefined();

    expect(store.getState().count).toBe(0);
    act(() => {
      store.getState().increment();
    });
    expect(store.getState().count).toBe(1);
  });

  describe('undo', () => {
    it('should undo', () => {
      const { undo } = store.temporal.getState();
      expect(store.getState().count).toBe(0);
      act(() => {
        store.getState().increment();
      });
      expect(store.getState().count).toBe(1);
      act(() => {
        undo();
      });
      expect(store.getState().count).toBe(0);
    });

    it('should undo multiple states (step)', () => {
      const { undo, pastStates } = store.temporal.getState();
      expect(pastStates.length).toBe(0);
      act(() => {
        store.getState().increment();
        store.getState().increment();
        store.getState().increment();
        store.getState().increment();
        store.getState().increment();
        store.getState().increment();
      });
      expect(store.temporal.getState().pastStates.length).toBe(6);
      act(() => {
        undo(4);
      });
      expect(store.temporal.getState().pastStates.length).toBe(2);
      expect(store.getState().count).toBe(2);
      expect(
        store.temporal.getState().futureStates.map((state) => state.count),
      ).toEqual([6, 5, 4, 3]);
      act(() => {
        undo(2);
      });
      expect(store.temporal.getState().pastStates.length).toBe(0);
      expect(store.getState().count).toBe(0);
    });
  });

  describe('redo', () => {
    it('should redo', () => {
      const { undo, redo } = store.temporal.getState();
      expect(store.getState().count).toBe(0);
      act(() => {
        store.getState().increment();
      });
      expect(store.getState().count).toBe(1);
      act(() => {
        undo();
      });
      expect(store.getState().count).toBe(0);
      act(() => {
        redo();
      });
      expect(store.getState().count).toBe(1);
    });

    it('should redo multiple states (step)', () => {
      const { undo, redo, pastStates, futureStates } =
        store.temporal.getState();
      expect(pastStates.length).toBe(0);
      act(() => {
        store.getState().increment();
        store.getState().increment();
        store.getState().increment();
        store.getState().increment();
        store.getState().increment();
        store.getState().increment();
      });
      expect(store.temporal.getState().pastStates.length).toBe(6);
      act(() => {
        undo(4);
      });
      expect(store.temporal.getState().pastStates.length).toBe(2);
      expect(store.getState().count).toBe(2);
      expect(store.temporal.getState().futureStates.length).toBe(4);
      act(() => {
        redo(4);
      });
      expect(store.temporal.getState().pastStates.length).toBe(6);
      expect(
        store.temporal.getState().pastStates.map((state) => state.count),
      ).toEqual([0, 1, 2, 3, 4, 5]);
      expect(store.getState().count).toBe(6);
    });
  });

  it('should clear', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
    expect(pastStates.length).toBe(0);
    act(() => {
      store.getState().increment();
    });
    expect(store.temporal.getState().pastStates.length).toBe(1);
    act(() => {
      store.getState().increment();
      store.getState().decrement();
    });
    expect(store.temporal.getState().pastStates.length).toBe(3);
    act(() => {
      undo(2);
    });
    expect(store.temporal.getState().pastStates.length).toBe(1);
    expect(store.temporal.getState().futureStates.length).toBe(2);
    act(() => {
      redo();
    });
    expect(store.temporal.getState().pastStates.length).toBe(2);
    expect(store.temporal.getState().futureStates.length).toBe(1);
    act(() => {
      clear();
    });
    expect(store.temporal.getState().pastStates.length).toBe(0);
    expect(store.temporal.getState().futureStates.length).toBe(0);
  });

  it('should update pastStates', () => {
    const { undo, redo, clear, pastStates } = store.temporal.getState();
    expect(store.temporal.getState().pastStates.length).toBe(0);
    act(() => {
      store.getState().increment();
    });
    expect(store.temporal.getState().pastStates.length).toBe(1);
    act(() => {
      store.getState().decrement();
    });
    expect(store.temporal.getState().pastStates.length).toBe(2);
    act(() => {
      undo();
    });
    expect(store.temporal.getState().pastStates.length).toBe(1);
    act(() => {
      undo();
    });
    expect(store.temporal.getState().pastStates.length).toBe(0);
    act(() => {
      redo();
    });
    expect(store.temporal.getState().pastStates.length).toBe(1);
    act(() => {
      clear();
    });
    expect(store.temporal.getState().pastStates.length).toBe(0);
  });

  it('should update futureStates', () => {
    const { undo, redo, clear, futureStates } = store.temporal.getState();
    expect(futureStates.length).toBe(0);
    act(() => {
      store.getState().increment();
    });
    expect(store.temporal.getState().futureStates.length).toBe(0);
    act(() => {
      store.getState().increment();
      store.getState().decrement();
    });
    expect(store.temporal.getState().futureStates.length).toBe(0);
    act(() => {
      undo(2);
    });
    expect(store.temporal.getState().futureStates.length).toBe(2);
    act(() => {
      redo();
    });
    expect(store.temporal.getState().futureStates.length).toBe(1);
    act(() => {
      clear();
    });
    expect(store.temporal.getState().futureStates.length).toBe(0);
  });

  it('properly tracks state values after clearing', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
    expect(pastStates.length).toBe(0);
    act(() => {
      store.getState().increment();
      store.getState().increment();
      store.getState().increment();
    });
    expect(store.temporal.getState().pastStates.length).toBe(3);
    act(() => {
      clear();
    });
    expect(store.temporal.getState().pastStates.length).toBe(0);
    expect(store.temporal.getState().futureStates.length).toBe(0);
    expect(store.temporal.getState().pastStates).toEqual([]);
    expect(store.temporal.getState().futureStates).toEqual([]);
    expect(store.getState().count).toBe(3);
    act(() => {
      store.getState().increment();
    });
    expect(store.temporal.getState().pastStates.length).toBe(1);
    expect(store.getState().count).toBe(4);
    act(() => {
      store.getState().increment();
      store.getState().increment();
      store.getState().increment();
    });
    expect(store.temporal.getState().pastStates.length).toBe(4);
    expect(store.getState().count).toBe(7);
    act(() => {
      undo(3);
    });
    expect(store.temporal.getState().pastStates.length).toBe(1);
    expect(store.getState().count).toBe(4);
    expect(store.temporal.getState().futureStates.length).toBe(3);
    act(() => {
      clear();
    });
    expect(store.temporal.getState().pastStates.length).toBe(0);
    expect(store.temporal.getState().futureStates.length).toBe(0);
    expect(store.temporal.getState().pastStates).toEqual([]);
    expect(store.temporal.getState().futureStates).toEqual([]);
    expect(store.getState().count).toBe(4);
  });

  it('should clear future states when set is called', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
    expect(pastStates.length).toBe(0);
    expect(futureStates.length).toBe(0);
    act(() => {
      store.getState().increment();
      store.getState().increment();
      store.getState().increment();
    });
    expect(store.temporal.getState().pastStates.length).toBe(3);
    expect(store.temporal.getState().futureStates.length).toBe(0);
    act(() => {
      undo(2);
    });
    expect(store.temporal.getState().pastStates.length).toBe(1);
    expect(store.temporal.getState().futureStates.length).toBe(2);
    act(() => {
      store.getState().increment();
      store.getState().increment();
      store.getState().increment();
    });
    expect(store.temporal.getState().pastStates.length).toBe(4);
    expect(store.temporal.getState().futureStates.length).toBe(0);
  });

  describe('temporal tracking status', () => {
    it('should initialize state to tracking', () => {
      const { trackingStatus } = store.temporal.getState();
      expect(trackingStatus).toBe('tracking');
    });

    it('should switch to paused', () => {
      const { pause } = store.temporal.getState();
      act(() => {
        pause();
      });
      expect(store.temporal.getState().trackingStatus).toBe('paused');
    });

    it('should switch to tracking', () => {
      const { resume, pause } = store.temporal.getState();
      act(() => {
        pause();
        resume();
      });
      expect(store.temporal.getState().trackingStatus).toBe('tracking');
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

  // Note: setOnSave and __internals are tested in options.test.ts since they are closely related
});
