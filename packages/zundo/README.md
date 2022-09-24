# 🍜 Zundo

enable time-travel in your apps. undo/redo middleware for [zustand](https://github.com/pmndrs/zustand). built with zustand. <1kB

[![Build Size](https://img.shields.io/bundlephobia/minzip/zundo/beta?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=zundo)
[![Version](https://img.shields.io/npm/v/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)
[![Downloads](https://img.shields.io/npm/dt/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)

![](https://github.com/charkour/zundo/raw/v0.2.0/zundo.gif)

See a [demo](https://codesandbox.io/s/currying-flower-2dom9?file=/src/App.tsx)

## Install

```sh
npm i zustand zundo@beta
```

> zustand v4.1.0 or higher is required for TS usage. v4.0.0 or higher is required for JS usage.

## Background

- Solves the issue of managing state in complex user applications
- Leverages zustand for state management, keeping the internals small
- Middleware can be used with multiple stores in the same app

<div style="width: 100%; display: flex;">
<img src="https://github.com/charkour/zundo/blob/main/zundo-mascot.png" style="margin: auto;" alt="Bear wearing a button up shirt textured with blue recycle symbols eating a bowl of noodles with chopsticks." width=300 />
</div>

## First create a store with temporal middleware

This returns the familiar store accessible by a hook! But now your store tracks past actions.

```tsx
import { temporal } from 'zundo'
import create from 'zustand'

// define the store (typescript)
interface StoreState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

// creates a store with undo/redo capability
const useStoreWithUndo = create<StoreState>()(
  temporal((set) => ({
    bears: 0,
    increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
    removeAllBears: () => set({ bears: 0 }),
  })),
);
```

## Then bind your components

Use your store anywhere, including `undo`, `redo`, and `clear`!

```tsx
const App = () => {
  const {
    bears,
    increasePopulation,
    removeAllBears,
  } = useStoreWithUndo();
  const {
    undo,
    redo,
    clear
  } = useStoreWithUndo.temporal.getState();

  return (
    <>
      bears: {bears}
      <button onClick={increasePopulation}>increase</button>
      <button onClick={removeAllBears}>remove</button>
      <button onClick={() => undo()}>undo</button>
      <button onClick={() => redo()}>redo</button>
      <button onClick={() => clear()}>clear</button>
    </>
  );
};
```

### Middleware Options

```tsx
interface ZundoOptions<State, TemporalState = State> {
  partialize?: (state: State) => TemporalState;
  limit?: number;
  equality?: (a: State, b: State) => boolean;
  onSave?: onSave<State>;
  handleSet?: (
    handleSet: StoreApi<State>['setState'],
  ) => StoreApi<State>['setState'];
}
```

#### **Exclude fields from being tracked in history**

Use the `partialize` option, which takes a callback where you can choose to omit or include specific fields.

```tsx
// Only field1 and field2 will be tracked
const useStoreA = create<StoreState>(
  temporal(
    set => ({ ... }),
    { partialize: (state) => {
      const { field1, field2, ...rest } = state
      return { field1, field2 }
    }}
  )
)

// Everything besides field1 and field2 will be tracked
const useStoreB = create<StoreState>(
  temporal(
    set => ({ ... }),
    { partialize: (state) => {
      const { field1, field2, ...rest } = state
      return rest;
    }}
  )
)
```

#### **Limit number of states stored**

For performance reasons, you may want to limit the number of previous and future states stored in history. Setting `limit` will limit the number of previous and future states stored in the `temporal` store. By default, no limit is set.

```tsx
const useStore = create<StoreState>(
  temporal(
    set => ({ ... }),
    { limit: 100 }
  )
);
```

#### **Prevent unchanged states to be stored**

For performance reasons, you may want to use a custom `equality` function to determine when a state change should be tracked. By default, all state changes to your store are tracked. You can write your own or use something like `lodash/deepEqual` or `zustand/shallow`.

```tsx
import shallow from 'zustand/shallow'

const useStoreA = create<StoreState>(
  temporal(
    set => ({ ... }),
    { equality: shallow }
  )
);

const useStoreB = create<StoreState>(
  temporal(
    set => ({ ... }),
    { equality: (a, b) => a.field1 !== b.field1 }
  )
);
```

#### **Callback when temporal store is updated**

Sometimes, you may need to call a function when the temporal store is updated. This can be configured using `onSave` in the options, or by programmatically setting the callback if you need lexical context.

```tsx
import shallow from 'zustand/shallow'

const useStoreA = create<StoreState>(
  temporal(
    set => ({ ... }),
    { onSave: (state) => console.log('saved', state) }
  )
);
```

#### **Cool-off period**

Sometimes multiple state changes might happen in a short amount of time and you only want to store one change in history. To do so, we can utilize the `handleSet` callback to set a timeout to prevent new changes from being stored in history.

```tsx
const withTemporal = temporal<MyState>(
  (set) => ({ ... }),
  {
    handleSet: (handleSet) =>
      throttle<typeof handleSet>((state) => {
        console.info('handleSet called');
        handleSet(state);
      }, 1000),
  },
);
```

### `useStore.temporal`

Temporal is a vanilla zustand store: see [StoreApi<T> from](https://github.com/pmndrs/zustand/blob/f0ff30f7c431f6bf25b3cb439d065a7e61355df4/src/vanilla.ts#L8) zustand for more details.

- `getState` returns the current state of the temporal store.
- `setState` updates the state of the temporal store.
- `subscribe` subscribes to changes in the temporal store.
- `destroy` destroys the temporal store.

### `useStore.temporal.getState`

```tsx
interface TemporalState<TState> {
  pastStates: TState[];
  futureStates: TState[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  trackingState: 'paused' | 'tracking';
  pause: () => void;
  resume: () => void;

  setOnSave: (onSave: onSave<TState>) => void;
}
```

#### **Going back in time**

`pastStates` is an array of previous states. The most recent previous state is at the end of the array. This is the state that will be applied when `undo` is called.

#### **Forward to the future**

`futureStates` is an array of future states. States are added when `undo` is called. The most recent future state is at the end of the array. This is the state that will be applied when `redo` is called. The future states are the "past past states."

#### **Back it up**

- `undo`: call function to apply previous state (if there are previous states). Optionally pass a number of steps to undo.

#### **Take it back now y'all**

- `redo`: call function to apply future state (if there are future states). Future states are "previous previous states." Optionally pass a number of steps to redo.

#### **Remove all knowledge of time**

- `clear`: call function to remove all stored states from your undo store. _Warning:_ clearing cannot be undone.

Dispatching a new state will clear all of the future states.

#### **Stop and start history**

- `trackingState`: returns a string that indicates whether the temporal store is tracking state changes or not. Possible values are `'paused'` or `'tracking'`. To pause and resume tracking, use `pause` and `resume`.

#### **Pause tracking of history**

- `pause`: call function to pause tracking state changes. This will prevent new states from being stored in history.

#### **Resume tracking of history**

- `resume`: call function to resume tracking state changes. This will allow new states to be stored in history.

#### **Programmatically add middleware to the setter**

- `setOnSave`: call function to set a callback that will be called when the temporal store is updated. This can be used to call the temporal store setter using values from the lexical context.

## Road Map

- [ ] create nicer API, or a helper hook in react land (useTemporal). or vanilla version of the it
- [ ] Allow alternative storage engines for past and future states
- [ ] See if it canUndo and canRedo
- [ ] Set initial history, past and future states
- [ ] create `jump` method that takes an integer
- [ ] create a `present` object that holds the current state? perhaps
- [ ] support history branches rather than clearing the future states
- [ ] Pass middleware to temporal store
- [ ] store state delta rather than full object
- [ ] track state for multiple stores at once

## Contributing

PRs are welcome! [pnpm](https://pnpm.io/) is used as a package manager. Run `pnpm install` to install local dependencies. Library code is located at `packages/zundo`.

## Author

- Charles Kornoelje ([@\_charkour](https://twitter.com/_charkour)) - [Tekton](www.tekton.com)

## Versioning

View the [releases](https://github.com/charkour/zundo/releases) for the change log.

## Illustration Credits

- Ivo Ilić ([@theivoson](https://twitter.com/theivoson))
