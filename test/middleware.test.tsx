import { useStore } from '../stories/bears.stories';
import { renderHook, act } from '@testing-library/react-hooks';

describe('zundo store', () => {
  const { result, rerender } = renderHook(() => useStore());

  test('increment', () => {
    for (let i = 0; i < 6; i++) {
      expect(result.current.bears).toBe(i);
      act(() => {
        result.current.increasePopulation();
      });
      rerender();
      expect(result.current.bears).toBe(i + 1);
    }
  });

  test('decrement', () => {
    for (let i = 6; i > 0; i--) {
      expect(result.current.bears).toBe(i);
      act(() => {
        result.current.decreasePopulation();
      });
      rerender();
      expect(result.current.bears).toBe(i - 1);
    }
  });

  test('undo', () => {
    rerender();
    expect(result.current.bears).toBe(0);
    act(() => {
      result.current.undo?.();
    });
    rerender();
    expect(result.current.bears).toBe(1);
  });

  test('redo', () => {
    expect(result.current.bears).toBe(1);
    act(() => {
      result.current.redo?.();
    });
    rerender();
    expect(result.current.bears).toBe(0);
  });
});