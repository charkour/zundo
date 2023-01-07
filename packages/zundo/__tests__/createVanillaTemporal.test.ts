import { describe, it, expect } from 'vitest';

describe('asdasd', () => {
  it('should ', () => {
    expect(1).toEqual(1)
  });
});

// import { describe, it, expect, vi } from 'vitest';
// vi.mock('zustand/vanilla');
// import { createVanillaTemporal } from '../src/temporal';
// import createVanilla from 'zustand/vanilla';
// import { act } from 'react-dom/test-utils';
//
// interface MyState {
//   count: number;
//   increment: () => void;
//   decrement: () => void;
// }
//
// // tests the createVanillaTemporal function rather than the temporal middleware
// // Not exhaustive, but also likely not needed
// describe('createVanillaTemporal', () => {
//   const store = createVanilla<MyState>((set) => {
//     return {
//       count: 0,
//       increment: () =>
//         set((state) => ({
//           count: state.count + 1,
//         })),
//       decrement: () =>
//         set((state) => ({
//           count: state.count - 1,
//         })),
//     };
//   });
//
//   const temporalStore = createVanillaTemporal(store.setState, store.getState);
//   const { undo, redo, clear, pastStates, futureStates } =
//     temporalStore.getState();
//   it('should have the objects defined', () => {
//     expect(undo).toBeDefined();
//     expect(redo).toBeDefined();
//     expect(clear).toBeDefined();
//     expect(pastStates).toBeDefined();
//     expect(futureStates).toBeDefined();
//
//     expect(store.getState().count).toBe(0);
//     act(() => {
//       store.getState().increment();
//     });
//     expect(store.getState().count).toBe(1);
//   });
// });
