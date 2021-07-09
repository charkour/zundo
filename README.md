# 🍜 Zundo

enable time-travel in your apps. undo/redo middleware for [zustand](https://github.com/pmndrs/zustand). built with zustand.

[![Build Size](https://img.shields.io/bundlephobia/min/zundo?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=zundo)
[![Version](https://img.shields.io/npm/v/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)
[![Downloads](https://img.shields.io/npm/dt/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)

![zundo demo](./zundo.gif)

See a [demo](https://codesandbox.io/s/currying-flower-2dom9?file=/src/App.tsx)

## Install

```sh
npm i zustand zundo
```

## First create a store with undo middleware

This returns the familiar store accessible by a hook! But now your store tracks past actions.

```tsx
import create, { UndoState } from 'zundo';

// define the store (typescript)
interface StoreState extends UndoState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

// creates a store with undo/redo capability
const useStoreWithUndo = create<StoreState>(set => ({
  bears: 0,
  increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));
```

## Then bind your components

Use your store anywhere, including `undo`, `redo`, and `clear`!

```tsx
const App = () => {
  const {
    bears,
    increasePopulation,
    removeAllBears,
    undo,
    redo,
    clear,
  } = useStoreWithUndo();

  return (
    <>
      bears: {bears}
      <button onClick={increasePopulation}>increase</button>
      <button onClick={removeAllBears}>remove</button>
      <button onClick={undo}>undo</button>
      <button onClick={redo}>redo</button>
      <button onClick={clear}>clear</button>
    </>
  );
};
```

## Alternatively, use the middleware

Instead of using `create` from `zundo`, use the `zundo` middleware and the `zustand` create.

```tsx
import { undoMiddleware, UndoState } from 'zundo';
import create from 'zustand';

const useStoreWithUndo = create<StoreState>(
  undoMiddleware(set => ({
    bears: 0,
    increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
    removeAllBears: () => set({ bears: 0 }),
  }))
);
```

### Other features

## Omit fields from being tracked in history

Some fields you may not want to track in history and they can be ignored by zundo middleware.
The second parameter for `undoMiddleware` is a string of keys on `StoreState` to be omitted from being tracked in history.

```tsx
const useStore = create<StoreState>(
  undoMiddleware(
    set => ({ ... }),
    ['field1', 'field2']
  )
);
```

## API

### `undoMiddleware(config: StateCreator<TState>)`

This is middleware for `zustand` which takes in a config for the store.

This works for multiple undoable stores in the same app.

### `create`

Create from `zundo` will return a store hook that has undo/redo capabilities. In addition to what fields are in the provided in your `StoreState`, the functions `undo`, `redo`, `clear`, and `getState` are added as well.

This works for multiple undoable stores in the same app.

- `undo`: call function to apply previous state (if there are previous states)
- `redo`: call function to apply future state (if there are future states). Future states are "previous previous states."
- `clear`: call function to remove all stored states from your undo store. _Warning:_ clearing cannot be undone.

Dispatching a new state will clear all of the future states.

### `createUndoStore()`

Will create a store that is used by the middleware to track the internal state of type `UndoStoreState`.

### `UndoState`

A type to extend when creating a global store with undo/redo capabilities.

```tsx
type UndoState = {
  // Will go back one state
  undo?: (() => void) | undefined;
  // Will go forward one state
  redo?: (() => void) | undefined;
  // Will clear
  clear?: (() => void) | undefined;
  getState?: (() => UndoStoreState) | undefined;
};
```

#### Usage

```tsx
import create, { UndoState } from 'zundo';

interface StoreState extends UndoState {
  // fields
}

const useStoreWithUndo = create<StoreState>();
// (set, get, api)
```

### `UseStore`

It is an interface from `zustand` where `T` is your `StoreState`. Very similar to the type definition shown below. It is the type of any `useStore` hook. Used when passing the `useStore` hook as a prop.

```tsx
type UseStore<T extends object> = {
    (): T;
    <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U> | undefined): U;
    setState: SetState<T>;
    getState: GetState<...>;
    subscribe: Subscribe<...>;
    destroy: Destroy;
}
```

### `UndoStoreState`

An interface for the store that tracks states.

```tsx
type UndoStoreState = {
  prevStates: any[];
  futureStates: any[];
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setStore: Function;
  getStore: Function;
};
```

## Road Map

- possibly use better data structure for storing previous states. Maybe just a diff between states?

## Contributing

Issues and PRs are welcome. I'd like to hear your comments and critiques. We can discuss ways to make this package better. Thanks :)
