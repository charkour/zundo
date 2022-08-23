# 🍜 Zundo

enable time-travel in your apps. undo/redo middleware for [zustand](https://github.com/pmndrs/zustand). built with zustand.

[![Build Size](https://img.shields.io/bundlephobia/min/zundo?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=zundo)
[![Version](https://img.shields.io/npm/v/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)
[![Downloads](https://img.shields.io/npm/dt/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)

<div style="width: 100%; display: flex;">
<img src="zundo-mascot.png" style="max-width: 300px; margin: auto;" alt="Bear wearing a button up shirt textured with blue recycle symbols eating a bowl of noodles with chopsticks." />
</div>

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
const useStoreWithUndo = create<StoreState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));
```

## Then bind your components

Use your store anywhere, including `undo`, `redo`, and `clearUndoHistory`!

```tsx
const App = () => {
  const {
    bears,
    increasePopulation,
    removeAllBears,
    undo,
    redo,
    clearUndoHistory,
  } = useStoreWithUndo();

  return (
    <>
      bears: {bears}
      <button onClick={increasePopulation}>increase</button>
      <button onClick={removeAllBears}>remove</button>
      <button onClick={() => undo?.()}>undo</button>
      <button onClick={() => redo?.()}>redo</button>
      <button onClick={clearUndoHistory}>clear</button>
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
  undoMiddleware((set) => ({
    bears: 0,
    increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
    removeAllBears: () => set({ bears: 0 }),
  })),
);
```

### Middleware Options

```tsx
options: {
  exclude?: string[],
  include?: string[],
  allowUnchanged?: boolean,
  historyDepthLimit?: number,
  coolOffDurationMs?: number,
}
```

#### **Exclude fields from being tracked in history**

Use the `exclude` option, which accepts an array of keys to not track. Alternatively you can use the `include` option which will result in only those keys being tracked.

_If for some reason you use both parameters, any key included in both will be excluded._

```tsx
// Only field1 and field2 will be tracked
const useStoreA = create<StoreState>(
  undoMiddleware(
    set => ({ ... }),
    { include: ['field1', 'field2'] }
  )
);

// Everything besides field1 and field2 will be tracked
const useStoreB = create<StoreState>(
  undoMiddleware(
    set => ({ ... }),
    { exclude: ['field1', 'field2'] }
  )
);
```

_Note: `exclude` replaces the option `omit` which will deprecated in future versions._

#### **Allow unchanged states to be stored**

Sometimes you may want to track states in history even if nothing has actually changed. Set `allowUnchanged` to be `true` to allow unchanged states to be stored. By default, it is `false` (well, technically it is `undefined`).

```tsx
const useStore = create<StoreState>(
  undoMiddleware(
    set => ({ ... }),
    { allowUnchanged: true }
  )
);
```

#### **Limit number of states stored**

For performance reasons, you may want to limit the number of previous and future states stored in history. Setting `historyDepthLimit` will limit the number of previous and future states stored in the `zundo` store. By default, no limit is set.

```tsx
const useStore = create<StoreState>(
  undoMiddleware(
    set => ({ ... }),
    { historyDepthLimit: 100 }
  )
);
```

## API

### `undoMiddleware(config: StateCreator<TState>)`

This is middleware for `zustand` which takes in a config for the store.

This works for multiple undoable stores in the same app.

### `create`

Create from `zundo` will return a store hook that has undo/redo capabilities. In addition to what fields are in the provided in your `StoreState`, the functions `undo`, `redo`, `clearUndoHistory`, and `getState` are added as well.

This works for multiple undoable stores in the same app.

- `undo`: call function to apply previous state (if there are previous states). Optionally pass a number of steps to undo.
- `redo`: call function to apply future state (if there are future states). Future states are "previous previous states." Optionally pass a number of steps to redo.
- `clearUndoHistory`: call function to remove all stored states from your undo store. _Warning:_ clearing cannot be undone.

Dispatching a new state will clear all of the future states.

### `createUndoStore()`

Will create a store that is used by the middleware to track the internal state of type `UndoStoreState`.

### `UndoState`

A type to extend when creating a global store with undo/redo capabilities.

```tsx
type UndoState = {
  // Will go back one state
  undo?: ((steps?: number) => void) | undefined;
  // Will go forward one state
  redo?: ((steps?: number) => void) | undefined;
  // Will clear history
  clearUndoHistory?: (() => void) | undefined;
  getState?: (() => UndoStoreState) | undefined;
  // history is enabled by default
  setIsUndoHistoryEnabled?: ((isEnabled: boolean) => void) | undefined;
};
```

#### **Enable or Disable History**

Sometimes you may want to disable storing states in history, for example, when animating a point across the screen and you only want to store the beginning and end points in history. Use `setIsUndoHistoryEnabled`, returned from `useStore` to set programmatically set `true` or `false`.

#### Usage

```tsx
import create, { UndoState } from 'zundo';

interface StoreState extends UndoState {
  // fields
}

const useStoreWithUndo = create<StoreState>();
// (set, get, api)
```

#### **Cool-off period**

Sometimes multiple state changes might happen in a short amount of time and you only want to store one change in history. Use `coolOffDurationMs` to set how long (in millesconds) to stop new changes from being stored in history after an initial change has happened.

Please note: Even if you don't set `coolOffDurationMs`, if multiple state changes happen inside of the same frame (e.g. you called `setSomething` multiple times in the same function call), only one item will be stored in history.

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
  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clearUndoHistory: () => void;
  setStore: Function;
  getStore: Function;
};
```

## Road Map

- possibly use better data structure for storing previous states. Maybe just a diff between states?

## Contributing

[pnpm](https://pnpm.io/) is used as a package manager. Run `pnpm install` to install local dependencies.

Issues and PRs are welcome. I'd like to hear your comments and critiques. We can discuss ways to make this package better. Thanks :)

## Author

- Charles Kornoelje ([@_charkour](https://twitter.com/_charkour)) - [Tekton](www.tekton.com)

## Versioning

View the [releases](https://github.com/charkour/zundo/releases) for the change log. This generally follows sem-ver, but breaking changes may occur in v1.

Publish using `np --no-cleanup`.

## Credits

- Illustration - [@theivoson](https://twitter.com/theivoson)

## Dependencies

### Zundo

zustand: for zundo features
react: optional for zundo features

### Building

tsup

### Testing

jest
@types/jest
ts-jest
typescript
