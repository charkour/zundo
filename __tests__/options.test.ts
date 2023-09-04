import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('zustand');
import { temporal } from '../src/index';
import { createStore, type StoreApi } from 'zustand';
import { act } from 'react-dom/test-utils';
import { shallow } from 'zustand/shallow';
import type {
  _TemporalState,
  ZundoOptions,
  TemporalState,
  Write,
} from '../src/types';
import throttle from 'lodash.throttle';
import { persist } from 'zustand/middleware';
import diff from 'microdiff';

const isEmpty = (obj: object) => {
  for (const _ in obj) {
    return false;
  }
  return true;
};

interface MyState {
  count: number;
  count2: number;
  myString: string;
  string2: string;
  boolean1: boolean;
  boolean2: boolean;
  increment: () => void;
  incrementOnly2: () => void;
  decrement: () => void;
  doNothing: () => void;
}

const createVanillaStore = (
  options?: ZundoOptions<MyState, Pick<MyState, 'count'>>,
) => {
  return createStore<MyState>()(
    temporal((set) => {
      return {
        count: 0,
        count2: 0,
        myString: 'hello',
        string2: 'world',
        boolean1: true,
        boolean2: false,
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
        incrementOnly2: () => set((state) => ({ count2: state.count2 + 1 })),
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
    store = createVanillaStore();
  });

  describe('partialize', () => {
    it('should not partialize by default', () => {
      const { pastStates, futureStates } = store.temporal.getState();
      expect(pastStates.length).toBe(0);
      expect(futureStates.length).toBe(0);
      act(() => {
        store.getState().increment();
        store.getState().increment();
      });
      expect(store.temporal.getState().pastStates.length).toBe(2);
      expect(store.temporal.getState().pastStates[0]).toEqual({
        count: 0,
        count2: 0,
        increment: expect.any(Function),
        decrement: expect.any(Function),
        doNothing: expect.any(Function),
        incrementOnly2: expect.any(Function),
        myString: 'hello',
        string2: 'world',
        boolean1: true,
        boolean2: false,
      });
      expect(store.temporal.getState().pastStates[1]).toEqual({
        count: 1,
        count2: 1,
        increment: expect.any(Function),
        decrement: expect.any(Function),
        doNothing: expect.any(Function),
        incrementOnly2: expect.any(Function),
        myString: 'hello',
        string2: 'world',
        boolean1: true,
        boolean2: false,
      });
      expect(store.getState()).toContain({ count: 2, count2: 2 });
    });

    it('should partialize the past states', () => {
      const storeWithPartialize = createVanillaStore({
        partialize: (state) => ({
          count: state.count,
        }),
      });
      expect(storeWithPartialize.temporal.getState().pastStates.length).toBe(0);
      expect(storeWithPartialize.temporal.getState().futureStates.length).toBe(
        0,
      );
      act(() => {
        storeWithPartialize.getState().increment();
        storeWithPartialize.getState().increment();
      });
      expect(storeWithPartialize.temporal.getState().pastStates.length).toBe(2);
      expect(storeWithPartialize.temporal.getState().pastStates[0]).toEqual({
        count: 0,
      });
      expect(storeWithPartialize.temporal.getState().pastStates[1]).toEqual({
        count: 1,
      });
      expect(storeWithPartialize.getState()).toContain({ count: 2, count2: 2 });
    });

    it('should partialize the future states', () => {
      const storeWithPartialize = createVanillaStore({
        partialize: (state) => ({
          count: state.count,
        }),
      });
      const { undo } = storeWithPartialize.temporal.getState();
      expect(storeWithPartialize.temporal.getState().pastStates.length).toBe(0);
      expect(storeWithPartialize.temporal.getState().futureStates.length).toBe(
        0,
      );

      act(() => {
        storeWithPartialize.getState().increment();
        storeWithPartialize.getState().increment();
        undo();
      });
      expect(storeWithPartialize.temporal.getState().futureStates.length).toBe(
        1,
      );
      expect(storeWithPartialize.temporal.getState().futureStates[0]).toEqual({
        count: 2,
      });
      expect(storeWithPartialize.getState()).toEqual({
        count: 1,
        count2: 2,
        increment: expect.any(Function),
        decrement: expect.any(Function),
        doNothing: expect.any(Function),
        incrementOnly2: expect.any(Function),
        boolean1: true,
        boolean2: false,
        myString: 'hello',
        string2: 'world',
      });
      act(() => {
        undo();
      });
      expect(storeWithPartialize.temporal.getState().futureStates.length).toBe(
        2,
      );
      expect(storeWithPartialize.temporal.getState().futureStates[1]).toEqual({
        count: 1,
      });
      expect(storeWithPartialize.getState()).toEqual({
        count: 0,
        count2: 2,
        increment: expect.any(Function),
        decrement: expect.any(Function),
        doNothing: expect.any(Function),
        incrementOnly2: expect.any(Function),
        boolean1: true,
        boolean2: false,
        myString: 'hello',
        string2: 'world',
      });
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
      const storeWithLimit = createVanillaStore({ limit: 3 });
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
      const storeWithEquality = createVanillaStore({
        equality: (pastState, currentState) =>
          currentState.count === pastState.count,
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
      const storeWithEquality = createVanillaStore({
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
    });
  });

  describe('diff function', () => {
    it('should use the diff function when set', () => {
      const storeWithDiff = createVanillaStore({
        diff: (pastState, currentState) => {
          const myDiff = diff(currentState, pastState);
          const newStateFromDiff = myDiff.reduce(
            (acc, difference) => {
              type State = typeof acc;
              type Key = keyof State;
              if (difference.type === 'CHANGE') {
                const pathAsString = difference.path.join('.') as Key;
                const value = difference.value;
                acc[pathAsString] = value;
              }
              return acc;
            },
            {} as Partial<typeof currentState>,
          );
          return isEmpty(newStateFromDiff) ? null : newStateFromDiff;
        },
      });
      const { doNothing, increment, incrementOnly2 } = storeWithDiff.getState();
      const { undo, redo } = storeWithDiff.temporal.getState();
      act(() => {
        doNothing();
        doNothing();
      });
      expect(storeWithDiff.temporal.getState().pastStates.length).toBe(0);
      act(() => {
        increment();
        increment();
        doNothing();
      });
      expect(storeWithDiff.temporal.getState().pastStates.length).toBe(2);
      expect(storeWithDiff.temporal.getState().pastStates[0]).toEqual({
        count: 0,
        count2: 0,
      });
      expect(storeWithDiff.temporal.getState().pastStates[1]).toEqual({
        count: 1,
        count2: 1,
      });
      expect(storeWithDiff.getState()).toContain({
        count: 2,
        count2: 2,
      });
      act(() => {
        doNothing();
        incrementOnly2();
      });
      expect(storeWithDiff.temporal.getState().pastStates.length).toBe(3);
      expect(storeWithDiff.temporal.getState().pastStates[2]).toEqual({
        count2: 2,
      });
      expect(storeWithDiff.getState()).toContain({
        count: 2,
        count2: 3,
      });
      act(() => {
        doNothing();
        incrementOnly2();
      });
      expect(storeWithDiff.temporal.getState().pastStates.length).toBe(4);
      expect(storeWithDiff.temporal.getState().pastStates[3]).toEqual({
        count2: 3,
      });
      expect(storeWithDiff.getState()).toContain({
        count: 2,
        count2: 4,
      });
      act(() => {
        undo(2);
      });
      expect(storeWithDiff.temporal.getState().pastStates.length).toBe(2);
      expect(storeWithDiff.temporal.getState().pastStates[0]).toEqual({
        count: 0,
        count2: 0,
      });
      expect(storeWithDiff.temporal.getState().futureStates.length).toBe(2);
      expect(storeWithDiff.temporal.getState().futureStates[0]).toEqual({
        count2: 4,
      });
      expect(storeWithDiff.temporal.getState().futureStates[1]).toEqual({
        count2: 3,
      });
      expect(storeWithDiff.getState()).toContain({
        count: 2,
        count2: 2,
      });
      act(() => {
        undo();
      });
      expect(storeWithDiff.temporal.getState().pastStates.length).toBe(1);
      expect(storeWithDiff.temporal.getState().pastStates[0]).toEqual({
        count: 0,
        count2: 0,
      });
      expect(storeWithDiff.temporal.getState().futureStates.length).toBe(3);
      expect(storeWithDiff.temporal.getState().futureStates[0]).toEqual({
        count2: 4,
      });
      expect(storeWithDiff.temporal.getState().futureStates[1]).toEqual({
        count2: 3,
      });
      expect(storeWithDiff.temporal.getState().futureStates[2]).toEqual({
        count: 2,
        count2: 2,
      });
      expect(storeWithDiff.getState()).toContain({
        count: 1,
        count2: 1,
      });
      act(() => {
        redo();
      });
      expect(storeWithDiff.temporal.getState().pastStates.length).toBe(2);
      expect(storeWithDiff.temporal.getState().pastStates[0]).toEqual({
        count: 0,
        count2: 0,
      });
      expect(storeWithDiff.temporal.getState().futureStates.length).toBe(2);
      expect(storeWithDiff.temporal.getState().futureStates[0]).toEqual({
        count2: 4,
      });
      expect(storeWithDiff.temporal.getState().futureStates[1]).toEqual({
        count2: 3,
      });
      expect(storeWithDiff.getState()).toContain({
        count: 2,
        count2: 2,
      });
      act(() => {
        redo(2);
      });
      expect(storeWithDiff.temporal.getState().pastStates.length).toBe(4);
      expect(storeWithDiff.temporal.getState().pastStates[0]).toEqual({
        count: 0,
        count2: 0,
      });
      expect(storeWithDiff.temporal.getState().futureStates.length).toBe(0);
      expect(storeWithDiff.getState()).toContain({
        count: 2,
        count2: 4,
      });
    });
  });

  describe('onSave', () => {
    it('should call the onSave function when set through options', () => {
      global.console.info = vi.fn();
      const storeWithOnSave = createVanillaStore({
        onSave: (pastStates) => {
          console.info(pastStates);
        },
      });
      const { doNothing, increment } = storeWithOnSave.getState();
      act(() => {
        increment();
        doNothing();
      });
      expect(storeWithOnSave.temporal.getState().pastStates.length).toBe(2);
      expect(console.info).toHaveBeenCalledTimes(2);
    });

    it('should call the onSave function when set through the temporal store function', () => {
      global.console.warn = vi.fn();
      const { doNothing, increment } = store.getState();
      const { setOnSave } = store.temporal.getState();
      act(() => {
        increment();
        doNothing();
      });
      expect(store.temporal.getState().pastStates.length).toBe(2);
      expect(console.warn).toHaveBeenCalledTimes(0);
      act(() => {
        setOnSave((pastStates, currentState) => {
          console.warn(pastStates, currentState);
        });
      });
      act(() => {
        increment();
        doNothing();
      });
      expect(store.temporal.getState().pastStates.length).toBe(4);
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    it('should call a new onSave function after being set', () => {
      global.console.info = vi.fn();
      global.console.warn = vi.fn();
      global.console.error = vi.fn();
      const storeWithOnSave = createVanillaStore({
        onSave: (pastStates) => {
          console.info(pastStates);
        },
      });
      const { doNothing, increment } = storeWithOnSave.getState();
      const { setOnSave } = storeWithOnSave.temporal.getState();
      act(() => {
        increment();
        doNothing();
      });
      expect(storeWithOnSave.temporal.getState().pastStates.length).toBe(2);
      expect(console.info).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledTimes(0);
      expect(console.error).toHaveBeenCalledTimes(0);
      act(() => {
        setOnSave((pastStates, currentState) => {
          console.warn(pastStates, currentState);
        });
      });
      act(() => {
        increment();
        doNothing();
      });
      expect(storeWithOnSave.temporal.getState().pastStates.length).toBe(4);
      expect(console.info).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledTimes(0);
      act(() => {
        setOnSave((pastStates, currentState) => {
          console.error(pastStates, currentState);
        });
      });
      act(() => {
        increment();
        doNothing();
      });
      expect(storeWithOnSave.temporal.getState().pastStates.length).toBe(6);
      expect(console.info).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleSet', () => {
    it('should update the temporal store as expected if no handleSet options is passed', () => {
      const { doNothing, increment } = store.getState();
      act(() => {
        increment();
        doNothing();
      });
      expect(store.temporal.getState().pastStates.length).toBe(2);
    });

    it('should call function if set', () => {
      global.console.info = vi.fn();
      const storeWithHandleSet = createVanillaStore({
        handleSet: (handleSet) => {
          return (state) => {
            console.info('handleSet called');
            handleSet(state);
          };
        },
      });
      const { doNothing, increment } = storeWithHandleSet.getState();
      act(() => {
        increment();
        doNothing();
      });
      expect(storeWithHandleSet.temporal.getState().pastStates[0]).toContain({
        count: 0,
      });
      expect(storeWithHandleSet.temporal.getState().pastStates[1]).toContain({
        count: 1,
      });
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(2);
      expect(console.info).toHaveBeenCalledTimes(2);
      act(() => {
        storeWithHandleSet.temporal.getState().undo(2);
      });
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(0);
      expect(storeWithHandleSet.temporal.getState().futureStates.length).toBe(
        2,
      );
      expect(console.info).toHaveBeenCalledTimes(2);
    });

    it('should call function if set (wrapTemporal)', () => {
      global.console.info = vi.fn();
      const storeWithHandleSet = createVanillaStore({
        wrapTemporal: (config) => {
          return (_set, get, store) => {
            const set: typeof _set = (partial, replace) => {
              console.info('handleSet called');
              _set(partial, replace);
            };
            return config(set, get, store);
          };
        },
      });
      const { doNothing, increment } = storeWithHandleSet.getState();
      act(() => {
        increment();
        doNothing();
      });
      expect(storeWithHandleSet.temporal.getState().pastStates[0]).toContain({
        count: 0,
      });
      expect(storeWithHandleSet.temporal.getState().pastStates[1]).toContain({
        count: 1,
      });
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(2);
      expect(console.info).toHaveBeenCalledTimes(2);
      act(() => {
        storeWithHandleSet.temporal.getState().undo(2);
      });
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(0);
      expect(storeWithHandleSet.temporal.getState().futureStates.length).toBe(
        2,
      );
      // Note: in the above test, the handleSet function is called twice, but in this test it is called 3 times because it is also called when undo() and redo() are called.
      expect(console.info).toHaveBeenCalledTimes(3);
    });

    it('should correctly use throttling', () => {
      global.console.error = vi.fn();
      vi.useFakeTimers();
      const storeWithHandleSet = createVanillaStore({
        handleSet: (handleSet) => {
          return throttle<typeof handleSet>((state) => {
            console.error('handleSet called');
            handleSet(state);
          }, 1000);
        },
      });
      const { doNothing, increment } = storeWithHandleSet.getState();
      act(() => {
        increment();
        increment();
        increment();
        increment();
      });
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(1);
      expect(console.error).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(1001);
      // By default, lodash.throttle includes trailing event
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(2);
      expect(console.error).toHaveBeenCalledTimes(2);
      act(() => {
        doNothing();
        doNothing();
        doNothing();
        doNothing();
      });
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(3);
      expect(console.error).toHaveBeenCalledTimes(3);
      vi.advanceTimersByTime(1001);
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(4);
      expect(console.error).toHaveBeenCalledTimes(4);
      act(() => {
        // Does not call handle set (and is not throttled)
        storeWithHandleSet.temporal.getState().undo(4);
        storeWithHandleSet.temporal.getState().redo(1);
      });
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(1);
      expect(storeWithHandleSet.temporal.getState().futureStates.length).toBe(
        3,
      );
      expect(console.error).toHaveBeenCalledTimes(4);
      vi.useRealTimers();
    });
    it('should correctly use throttling (wrapTemporal)', () => {
      global.console.error = vi.fn();
      vi.useFakeTimers();
      const storeWithHandleSet = createVanillaStore({
        wrapTemporal: (config) => {
          return (_set, get, store) => {
            const set: typeof _set = throttle<typeof _set>(
              (partial, replace) => {
                console.error('handleSet called');
                _set(partial, replace);
              },
              1000,
            );
            return config(set, get, store);
          };
        },
      });
      const { doNothing, increment } = storeWithHandleSet.getState();
      act(() => {
        increment();
      });
      vi.runAllTimers();
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(1);
      expect(console.error).toHaveBeenCalledTimes(1);
      act(() => {
        doNothing();
      });
      vi.runAllTimers();
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(2);
      expect(console.error).toHaveBeenCalledTimes(2);
      act(() => {
        storeWithHandleSet.temporal.getState().undo(2);
      });
      vi.runAllTimers();
      expect(storeWithHandleSet.temporal.getState().pastStates.length).toBe(0);
      expect(storeWithHandleSet.temporal.getState().futureStates.length).toBe(
        2,
      );
      expect(console.warn).toHaveBeenCalledTimes(2);
    });
  });

  describe('wrapTemporal', () => {
    describe('should wrap temporal store in given middlewares', () => {
      it('persist', () => {
        const storeWithTemporalWithPersist = createVanillaStore({
          wrapTemporal: (config) => persist(config, { name: '123' }),
        });

        expect(storeWithTemporalWithPersist.temporal).toHaveProperty('persist');
      });

      it('temporal', () => {
        const storeWithTemporalWithTemporal = createVanillaStore({
          wrapTemporal: (store) => temporal(store),
        });
        expect(storeWithTemporalWithTemporal.temporal).toHaveProperty(
          'temporal',
        );
      });

      it('temporal and persist', () => {
        const storeWithTemporalWithMiddleware = createVanillaStore({
          wrapTemporal: (store) => temporal(persist(store, { name: '123' })),
        });
        expect(storeWithTemporalWithMiddleware.temporal).toHaveProperty(
          'persist',
        );
        expect(storeWithTemporalWithMiddleware.temporal).toHaveProperty(
          'temporal',
        );
      });
    });
  });

  describe('secret internals', () => {
    it('should have a secret internal state', () => {
      const { _handleSet, _onSave } =
        store.temporal.getState() as _TemporalState<MyState>;
      expect(_handleSet).toBeInstanceOf(Function);
      expect(_onSave).toBe(undefined);
    });
    describe('onSave', () => {
      it('should call onSave cb without adding a new state when onSave is set by user', () => {
        global.console.error = vi.fn();
        const { setOnSave } = store.temporal.getState();
        act(() => {
          setOnSave((pastStates, currentState) => {
            console.error(pastStates, currentState);
          });
        });
        const { _onSave } =
          store.temporal.getState() as _TemporalState<MyState>;
        act(() => {
          _onSave(store.getState(), store.getState());
        });
        expect(_onSave).toBeInstanceOf(Function);
        expect(store.temporal.getState().pastStates.length).toBe(0);
        expect(console.error).toHaveBeenCalledTimes(1);
      });
      it('should call onSave cb without adding a new state when onSave is set at store init options', () => {
        global.console.info = vi.fn();
        const storeWithOnSave = createVanillaStore({
          onSave: (pastStates) => {
            console.info(pastStates);
          },
        });
        const { _onSave } =
          storeWithOnSave.temporal.getState() as _TemporalState<MyState>;
        act(() => {
          _onSave(storeWithOnSave.getState(), storeWithOnSave.getState());
        });
        expect(storeWithOnSave.temporal.getState().pastStates.length).toBe(0);
        expect(console.info).toHaveBeenCalledTimes(1);
      });
      it('should call onSave cb without adding a new state and respond to new setOnSave', () => {
        global.console.dir = vi.fn();
        global.console.trace = vi.fn();
        const storeWithOnSave = createVanillaStore({
          onSave: (pastStates) => {
            console.dir(pastStates);
          },
        });
        act(() => {
          (
            storeWithOnSave.temporal.getState() as _TemporalState<MyState>
          )._onSave(storeWithOnSave.getState(), storeWithOnSave.getState());
        });
        expect(storeWithOnSave.temporal.getState().pastStates.length).toBe(0);
        expect(console.dir).toHaveBeenCalledTimes(1);
        expect(console.trace).toHaveBeenCalledTimes(0);

        const { setOnSave } = storeWithOnSave.temporal.getState();
        act(() => {
          setOnSave((pastStates, currentState) => {
            console.trace(pastStates, currentState);
          });
        });
        act(() => {
          (
            storeWithOnSave.temporal.getState() as _TemporalState<MyState>
          )._onSave(store.getState(), store.getState());
        });
        expect(store.temporal.getState().pastStates.length).toBe(0);
        expect(console.dir).toHaveBeenCalledTimes(1);
        expect(console.trace).toHaveBeenCalledTimes(1);
      });
    });

    describe('handleUserSet', () => {
      it('should update the temporal store with the pastState when called', () => {
        const { _handleSet } =
          store.temporal.getState() as _TemporalState<MyState>;
        act(() => {
          _handleSet(store.getState());
        });
        expect(store.temporal.getState().pastStates.length).toBe(1);
      });

      it('should only update if the the status is tracking', () => {
        const { _handleSet } =
          store.temporal.getState() as _TemporalState<MyState>;
        act(() => {
          _handleSet(store.getState());
        });
        expect(store.temporal.getState().pastStates.length).toBe(1);
        act(() => {
          store.temporal.getState().pause();
          _handleSet(store.getState());
        });
        expect(store.temporal.getState().pastStates.length).toBe(1);
        act(() => {
          store.temporal.getState().resume();
          _handleSet(store.getState());
        });
      });

      // TODO: should this check the equality function, limit, and call onSave? These are already tested but indirectly.
    });
  });

  describe('init pastStates', () => {
    it('should init the pastStates with the initial state', () => {
      const storeWithPastStates = createVanillaStore({
        pastStates: [{ count: 0 }, { count: 1 }],
      });
      expect(storeWithPastStates.temporal.getState().pastStates.length).toBe(2);
    });
    it('should be able to call undo on init pastStates', () => {
      const storeWithPastStates = createVanillaStore({
        pastStates: [{ count: 999 }, { count: 1000 }],
      });
      expect(storeWithPastStates.getState().count).toBe(0);
      act(() => {
        storeWithPastStates.temporal.getState().undo();
      });
      expect(storeWithPastStates.getState().count).toBe(1000);
    });
  });

  describe('init futureStates', () => {
    it('should init the futureStates with the initial state', () => {
      const storeWithFutureStates = createVanillaStore({
        futureStates: [{ count: 0 }, { count: 1 }],
      });
      expect(
        storeWithFutureStates.temporal.getState().futureStates.length,
      ).toBe(2);
    });
    it('should be able to call redo on init futureStates', () => {
      const storeWithFutureStates = createVanillaStore({
        futureStates: [{ count: 1001 }, { count: 1000 }],
      });
      expect(storeWithFutureStates.getState().count).toBe(0);
      act(() => {
        storeWithFutureStates.temporal.getState().redo();
      });
      expect(storeWithFutureStates.getState().count).toBe(1000);
    });
  });
});

describe('setState', () => {
  it('it should correctly update the state', () => {
    const store = createVanillaStore();
    const setState = store.setState;
    act(() => {
      setState({ count: 100 });
    });
    expect(store.getState().count).toBe(100);
    expect(store.temporal.getState().pastStates.length).toBe(1);
    act(() => {
      store.temporal.getState().undo();
    });
    expect(store.getState().count).toBe(0);
    expect(store.temporal.getState().pastStates.length).toBe(0);
    expect(store.temporal.getState().futureStates.length).toBe(1);
  });
});
