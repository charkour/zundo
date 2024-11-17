import { temporal, type TemporalState } from 'zundo';
import { createStore } from 'zustand';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';

interface MyState {
  fontSize: number;
  changeFontSize: (fontSize: number) => void;
}

const withZundo = temporal<MyState>((set) => ({
  fontSize: 16,
  changeFontSize: (fontSize) => set({ fontSize }),
}));

const originalStore = createStore(withZundo);

const useBaseStore = <T extends unknown>(
  selector: (state: MyState) => T,
  equality?: (a: T, b: T) => boolean,
) => useStoreWithEqualityFn(originalStore, selector, equality);
const useTemporalStore = <T extends unknown>(
  selector: (state: TemporalState<MyState>) => T,
  equality?: (a: T, b: T) => boolean,
) => useStoreWithEqualityFn(originalStore.temporal, selector, equality);

export default function App() {
  const { fontSize, changeFontSize } = useBaseStore((state) => state);
  const { futureStates, pastStates, undo, resume, pause } = useTemporalStore(
    (state) => state,
    shallow,
  );

  return (
    <div>
      <h1>Web</h1>
      <div>
        <input
          type="number"
          value={fontSize}
          onFocus={() => {
            changeFontSize(fontSize);
            pause();
          }}
          onChange={(e) => changeFontSize(e.target.valueAsNumber)}
          onBlur={(e) => {
            resume();
            changeFontSize(e.target.valueAsNumber);
          }}
        />
        <span>{fontSize}</span>
        <div>
          <h2>Future States</h2>
          <div>{JSON.stringify(futureStates)}</div>
          <h2>Previous States</h2>
          <div>{JSON.stringify(pastStates)}</div>
          <button onClick={() => undo()}>Undo</button>
        </div>
      </div>
    </div>
  );
}
