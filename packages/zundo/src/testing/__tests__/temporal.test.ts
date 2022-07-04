import { createTemporalStore } from '../../temporal';
import createVanilla from 'zustand/vanilla';
import create from 'zustand';

interface MyState {
  count: number
}

describe('Temporal', () => {
  const store = createVanilla<MyState>(() => {
    return { count: 0 };
  })
  const useStore = create(store);
  it('should work', () => {
    const temporalStore = createTemporalStore(store.setState, useStore.getState);
    const { undo, redo, clear, pastStates, futureStates } = temporalStore.getState();
    expect(undo).toBeDefined();
    expect(redo).toBeDefined();
    expect(clear).toBeDefined();
    expect(pastStates).toBeDefined();
    expect(futureStates).toBeDefined();
  });
});
