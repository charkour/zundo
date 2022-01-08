import { renderHook, act } from '@testing-library/react-hooks';
import create from 'zustand';
import { undoMiddleware } from '../src';

interface StoreState {
  bears: number;
  ignored: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  decreasePopulation: () => void;
  doNothing: () => void;
}

// create a store with undo middleware
export const useStore = create(
  undoMiddleware<StoreState>(
    (set) => ({
      bears: 0,
      ignored: 0,
      increasePopulation: () =>
        set((state) => ({
          bears: state.bears + 1,
          ignored: state.ignored + 1,
        })),
      decreasePopulation: () =>
        set((state) => ({
          bears: state.bears - 1,
          ignored: state.ignored - 1,
        })),
      doNothing: () => set((state) => ({ ...state })),
      removeAllBears: () => set({ bears: 0 }),
    }),
    { exclude: ['ignored'], historyDepthLimit: 10 },
  ),
);

describe('zundo store', () => {
  const { result, rerender } = renderHook(() => useStore());

  test('increment', async () => {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 6; i++) {
      expect(result.current.bears).toBe(i);
      act(() => {
        result.current.increasePopulation();
      });
      rerender();
      expect(result.current.bears).toBe(i + 1);

      // Wait 1 ms between actions for zundo cool-off
      // eslint-disable-next-line
      await new Promise((r) => setTimeout(r, 1));
    }
  });

  test('decrement', async () => {
    // eslint-disable-next-line no-plusplus
    for (let i = 6; i > 0; i--) {
      expect(result.current.bears).toBe(i);
      act(() => {
        result.current.decreasePopulation();
      });
      rerender();
      expect(result.current.bears).toBe(i - 1);

      // Wait 1 ms between actions for zundo cool-off
      // eslint-disable-next-line
      await new Promise((r) => setTimeout(r, 1));
    }
  });

  test('undo', () => {
    rerender();
    expect(result.current.bears).toBe(0);
    act(() => {
      result.current.zundo?.undo();
    });
    rerender();
    expect(result.current.bears).toBe(1);
  });

  test('redo', () => {
    expect(result.current.bears).toBe(1);
    act(() => {
      result.current.zundo?.redo();
    });
    rerender();
    expect(result.current.bears).toBe(0);
  });

  test('increment many without wait (no cool off)', async () => {
    expect(result.current.bears).toBe(0);
    act(() => {
      result.current.increasePopulation();
      result.current.increasePopulation();
      result.current.increasePopulation();
    });
    rerender();
    expect(result.current.bears).toBe(3);
  });

  test('undo after many added without wait (no cool off)', async () => {
    rerender();
    expect(result.current.bears).toBe(3);
    act(() => {
      result.current.zundo?.undo();
    });
    rerender();
    expect(result.current.bears).toBe(0);
  });
});
