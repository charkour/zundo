import type { StateCreator } from 'zustand';
import type { TemporalState } from 'zundo';
import { temporal } from 'zundo';
import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';

interface BearSlice {
  bears: number
  addBear: () => void
  eatFish: () => void
}

interface FishSlice {
  fishes: number
  addFish: () => void
}

const createBearSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  removeBear: () => set((state) => ({ bears: state.bears - 1 })),
  eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
})

const createFishSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

const useSharedStore = create<BearSlice & FishSlice>()(
  temporal(
    (...a) => ({
      ...createBearSlice(...a),
      ...createFishSlice(...a),
    }), 
    { 
      limit: 10 
    }
  )
)

function useTemporalStore(): TemporalState<BearSlice & FishSlice>;
function useTemporalStore<T>(
  selector: (state: TemporalState<BearSlice & FishSlice>) => T
): T;
function useTemporalStore<T>(
  selector: (state: TemporalState<BearSlice & FishSlice>) => T,
  equality: (a: T, b: T) => boolean
): T;
function useTemporalStore<T>(
  selector?: (state: TemporalState<BearSlice & FishSlice>) => T,
  equality?: (a: T, b: T) => boolean
) {
  return useStoreWithEqualityFn(useSharedStore.temporal, selector!, equality);
}

const UndoBar = () => {
  const { undo, redo, pastStates, futureStates } = useTemporalStore(
    (state) => ({
      undo: state.undo,
      redo: state.redo,
      pastStates: state.pastStates,
      futureStates: state.futureStates,
    })
  );

  return (
    <div>
      past states: {JSON.stringify(pastStates)}
      <br />
      future states: {JSON.stringify(futureStates)}
      <br />
      <button onClick={() => undo()} disabled={!pastStates.length}>
        undo
      </button>
      <button onClick={() => redo()} disabled={!futureStates.length}>
        redo
      </button>
    </div>
  );
};

const BearState = () => {
  const { bears, addBear, eatFish } = useSharedStore(useShallow((state) => ({
    bears: state.bears,
    addBear: state.addBear,
    eatFish: state.eatFish,
  })));

  return (
    <div>
      bears: {bears}
      <br />
      <button onClick={addBear}>Add Bear</button>
      <button onClick={eatFish}>Eat Fish</button>
    </div>
  );
};

const FishState = () => {
  const { fishes, addFish } = useSharedStore(useShallow((state) => ({
    fishes: state.fishes,
    addFish: state.addFish,
  })));

  return (
    <div>
      fishes: {fishes}
      <br />
      <button onClick={addFish}>Add Fish</button>
    </div>
  );
};

const App = () => {
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
        <BearState />
        <FishState />
        <br />
         <UndoBar /> 
    </div>
  );
};

export default App;
