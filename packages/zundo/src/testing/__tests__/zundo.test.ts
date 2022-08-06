import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('zustand/vanilla');
import { TemporalState, Write, zundo } from '../../index';
import createVanilla, { StoreApi } from 'zustand/vanilla';
import { act } from 'react-dom/test-utils';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

describe('Zundo', () => {
  let store: Write<
    StoreApi<MyState>,
    {
      temporal: StoreApi<TemporalState<MyState>>;
    }
  >;
  // Recreate store for each test
  beforeEach(() => {
    store = createVanilla<MyState>()(
      zundo((set) => {
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
      }),
    );
  });

  it('should have the objects defined', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
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

  it('should undo', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
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

  it('should redo', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
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

  it('should update pastStates', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
    expect(pastStates.length).toBe(0);
    act(() => {
      store.getState().increment();
    });
    expect(pastStates.length).toBe(1);
    act(() => {
      store.getState().decrement();
    });
    expect(pastStates.length).toBe(2);
    act(() => {
      undo();
    });
    expect(pastStates.length).toBe(1);
    act(() => {
      undo();
    });
    expect(pastStates.length).toBe(0);
  });

  it('should update futureStates', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
    expect(futureStates.length).toBe(0);
    act(() => {
      store.getState().increment();
    });
    expect(futureStates.length).toBe(0);
    act(() => {
      store.getState().decrement();
    });
    expect(futureStates.length).toBe(0);
    act(() => {
      undo();
    });
    expect(futureStates.length).toBe(1);
    act(() => {
      redo();
    });
    expect(futureStates.length).toBe(0);
  });

  it('should clear', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
    expect(pastStates.length).toBe(0);
    act(() => {
      store.getState().increment();
    });
    expect(pastStates.length).toBe(1);
    act(() => {
      store.getState().decrement();
    });
    expect(pastStates.length).toBe(2);
    act(() => {
      undo();
    });
    expect(pastStates.length).toBe(1);
    expect(futureStates);
    act(() => {
      clear();
    });
    expect(pastStates.length).toBe(0);
    expect(futureStates.length).toBe(0);
  });

  it('should undo multiple states', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
    expect(pastStates.length).toBe(0);
    act(() => {
      store.getState().increment();
      store.getState().increment();
      store.getState().increment();
    });
    expect(pastStates.length).toBe(3);
    act(() => {
      undo(2);
    });
    expect(pastStates.length).toBe(1);
    expect(store.getState().count).toBe(1);
    act(() => {
      undo();
    });
    expect(pastStates.length).toBe(0);
    expect(store.getState().count).toBe(0);
  });

  it('should redo multiple states', () => {
    const { undo, redo, clear, pastStates, futureStates } =
      store.temporal.getState();
    expect(pastStates.length).toBe(0);
    act(() => {
      store.getState().increment();
      store.getState().increment();
      store.getState().increment();
    });
    expect(pastStates.length).toBe(3);
    act(() => {
      undo(2);
    });
    expect(pastStates.length).toBe(1);
    expect(store.getState().count).toBe(1);
    expect(futureStates.length).toBe(2);
    act(() => {
      redo(2);
    });
    expect(pastStates.length).toBe(3);
    expect(store.getState().count).toBe(3);
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
    expect(pastStates.length).toBe(3);
    act(() => {
      clear();
    });
    expect(pastStates.length).toBe(0);
    expect(futureStates.length).toBe(0);
    expect(pastStates).toEqual([]);
    expect(futureStates).toEqual([]);
    expect(store.getState().count).toBe(3);
    act(() => {
      store.getState().increment();
    });
    expect(pastStates.length).toBe(1);
    expect(store.getState().count).toBe(4);
    act(() => {
      store.getState().increment();
      store.getState().increment();
      store.getState().increment();
    });
    expect(pastStates.length).toBe(4);
    expect(store.getState().count).toBe(7);
    act(() => {
      undo(3);
    });
    expect(pastStates.length).toBe(1);
    expect(store.getState().count).toBe(4);
    expect(futureStates.length).toBe(3);
    act(() => {
      clear();
    });
    expect(pastStates.length).toBe(0);
    expect(futureStates.length).toBe(0);
    expect(pastStates).toEqual([]);
    expect(futureStates).toEqual([]);
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
    expect(pastStates.length).toBe(3);
    expect(futureStates.length).toBe(0);
    act(() => {
      undo(2);
    });
    expect(pastStates.length).toBe(1);
    expect(futureStates.length).toBe(2);
    act(() => {
      store.getState().increment();
      store.getState().increment();
      store.getState().increment();
    });
    expect(pastStates.length).toBe(4);
    expect(futureStates.length).toBe(0);
  });
});
