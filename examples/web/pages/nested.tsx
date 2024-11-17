import { temporal, type TemporalState } from 'zundo';
import {
  create,
  type StateCreator,
  type StoreMutatorIdentifier,
} from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';

interface MyState {
  incrementBears: () => void;
  incrementUntrackedValue: () => void;
  incrementAll: () => void;
  incrementSimple: () => void;
  simple: number;
  nested: { bears: number; untrackedValue: number };
}

type HistoryTrackedState = Omit<MyState, 'untrackedValue'>;

// Note: This one is incomplete
const middle = <
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  config: StateCreator<T, Mps, Mcs>,
): StateCreator<T, Mps, Mcs> => {
  const foo: StateCreator<T, Mps, Mcs> = (_set, get, store) => {
    const set: typeof _set = (state, replace) => {
      if (state instanceof Function) {
        _set(mergeDeep(get(), state(get())), replace);
        return;
      }
      _set(mergeDeep(get(), state), replace);
    };
    store.setState = set;
    return config(set, get, store);
  };
  return foo;
};

const useMyStore = create<MyState>()(
  middle(
    temporal(
      (set) => ({
        simple: 0,
        nested: { bears: 0, untrackedValue: 0 },
        incrementBears: () =>
          set(({ nested: { bears, untrackedValue } }) => ({
            nested: { bears: bears + 1, untrackedValue },
          })),
        incrementAll: () =>
          set(({ nested: { bears, untrackedValue }, simple }) => ({
            nested: { bears: bears + 1, untrackedValue: untrackedValue + 1 },
            simple: simple + 1,
          })),
        incrementUntrackedValue: () =>
          set(({ nested: { bears, untrackedValue } }) => ({
            nested: { bears: bears, untrackedValue: untrackedValue + 1 },
          })),
        incrementSimple: () => set(({ simple }) => ({ simple: simple + 1 })),
      }),
      {
        partialize: (state): HistoryTrackedState => {
          const { nested } = state;
          // TODO: recursive partial
          return { nested: { bears: nested.bears } };
        },
      },
    ),
  ),
);

/**
 * Performs a deep merge of objects and returns new object. Does not modify
 * objects (immutable) and merges arrays via concatenation.
 *
 * @param {...object} objects - Objects to merge
 * @returns {object} New object with merged key/values
 * Citation: {@link https://stackoverflow.com/a/48218209/9931154 Stack Overflow Reference}
 */
function mergeDeep(...objects: any[]) {
  const isObject = (obj: unknown) => obj && typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

const useTemporalStore = <T,>(
  selector: (state: TemporalState<HistoryTrackedState>) => T,
  equality?: (a: T, b: T) => boolean,
) => useStoreWithEqualityFn(useMyStore.temporal, selector, equality);

const App = () => {
  const store = useMyStore();
  const {
    simple,
    nested,
    incrementUntrackedValue,
    incrementAll,
    incrementBears,
    incrementSimple,
  } = store;
  const { undo, redo, clear, futureStates, pastStates } = useTemporalStore(
    (state) => state,
  );

  return (
    <div>
      <h1>
        {' '}
        <span role="img" aria-label="bear">
          🐻
        </span>{' '}
        <span role="img" aria-label="recycle">
          ♻️
        </span>{' '}
        Zundo!
      </h1>
      <h2>
        With config options: <br />
        partialize, handleSet, equality
      </h2>
      <p>The throttle value is set to 500ms.</p>
      <p>untrackedValue is not tracked in history (partialize)</p>
      <p>equality function is fast-deep-equal</p>
      <p>
        Note that clicking the button that increments untrackedValue prior to
        incrementing bears results in state history of bears not being tracked
      </p>
      <button onClick={incrementAll}>increment all</button>
      <br /> <br />
      <button onClick={incrementBears}>increment bears</button>
      <br /> <br />
      <button onClick={incrementUntrackedValue}>increment untracked</button>
      <br /> <br />
      <button onClick={incrementSimple}>increment simple</button>
      <br /> <br />
      <button onClick={() => undo()}>undo</button>
      <button onClick={() => redo()}>redo</button>
      <button onClick={() => clear()}>clear</button>
      <br /> <br />
      past states: {JSON.stringify(pastStates)}
      <br />
      future states: {JSON.stringify(futureStates)}
      <br />
      current state: {JSON.stringify(store)}
      <br />
      <br />
      nested.bears: {nested.bears}
      <br />
      nested.untrackedValue: {nested.untrackedValue}
      <br />
      simple: {simple}
      <br />
    </div>
  );
};

export default App;
