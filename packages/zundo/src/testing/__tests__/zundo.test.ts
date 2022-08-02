import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('zustand/vanilla');
import { Write, zundo } from '../../index';
import createVanilla, { StoreApi } from 'zustand/vanilla';
import { act } from 'react-dom/test-utils';
import { Temporal } from '../../temporal';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

describe('Zundo', () => {
  let store: Write<
    StoreApi<MyState>,
    {
      temporal: Temporal<MyState>;
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
    const { undo, redo, clear, pastStates, futureStates } = store.temporal;
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
    const { undo, redo, clear, pastStates, futureStates } = store.temporal;
    expect(store.getState().count).toBe(0);
    act(() => {
      store.getState().increment();
    });

    expect(store.getState().count).toBe(1);
    act(() => {
      undo();
    });
    console.log(store.getState());
    expect(store.getState().count).toBe(0);
  });

  it('should redo', () => {
    const { undo, redo, clear, pastStates, futureStates } = store.temporal;
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
    const { undo, redo, clear, pastStates, futureStates } = store.temporal;
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
    const { undo, redo, clear, pastStates, futureStates } = store.temporal;
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
    const { undo, redo, clear, pastStates, futureStates } = store.temporal;
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
    expect(futureStates)
    act(() => {
      clear();
    });
    expect(pastStates.length).toBe(0);
    expect(futureStates.length).toBe(0);
  });
});
