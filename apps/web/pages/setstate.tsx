import { create } from "zustand";
import { temporal } from "zundo";

interface ExampleData {
  key1: boolean;
  key2: number;
}

const store = create<ExampleData>()(
  temporal(() => ({
    key1: false as boolean,
    key2: 32
  }))
);

const useTemporal = create(store.temporal);

const App = () => {
  const data = store();
  const { undo } = useTemporal();

  return (
    <>
      <button
        onClick={() => {
          store.setState((state) => ({ key1: !state.key1 }));
        }}
      >
        Change key 1
      </button>
      <button
        onClick={() => {
          store.setState((state) => ({ key2: state.key2 + 1 }));
        }}
      >
        Change key 2
      </button>

      <br />

      <h3>Data</h3>
      <p>{JSON.stringify(data, undefined, 2)}</p>
      <button onClick={() => store.temporal.getState().undo()}>undo</button>
      <button onClick={() => undo()}>undo2</button>
    </>
  );
};
export default App;