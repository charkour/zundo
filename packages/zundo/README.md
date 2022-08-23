# 🍜 Zundo

enable time-travel in your apps. undo/redo middleware for [zustand](https://github.com/pmndrs/zustand). built with zustand.

[![Build Size](https://img.shields.io/bundlephobia/min/zundo?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=zundo)
[![Version](https://img.shields.io/npm/v/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)
[![Downloads](https://img.shields.io/npm/dt/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)

<div style="width: 100%; display: flex;">
<img src="zundo-mascot.png" style="max-width: 100px; margin: auto;" alt="Bear wearing a button up shirt textured with blue recycle symbols eating a bowl of noodles with chopsticks." />
</div>

See a [demo](https://codesandbox.io/s/currying-flower-2dom9?file=/src/App.tsx)

## Install

```sh
npm i zustand zundo@beta
```

## Background

- Solves the issue of managing state in complex user applications
- Leverages zustand for state management, keeping the internals small
- Middleware can be used with multiple stores in the same app

## First create a store with temporal middleware

This returns the familiar store accessible by a hook! But now your store tracks past actions.

```tsx
import { zundo } from 'zundo'
import create from 'zustand'

// define the store (typescript)
interface StoreState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

// creates a store with undo/redo capability
const useStoreWithUndo = create<StoreState>()(
  zundo((set) => ({
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

_If for some reason you use both parameters, any key included in both will be excluded._

```tsx
// Only field1 and field2 will be tracked
const useStoreA = create<StoreState>(
  zundo(
    set => ({ ... }),
    { partialize: (state) => {
      const { field1, field2, ...rest } = state
      return { field1, field2 }
    }}
  )
)

// Everything besides field1 and field2 will be tracked
const useStoreB = create<StoreState>(
  undoMiddleware(
    set => ({ ... }),
    { partialize: (state) => {
      const { field1, field2, ...rest } = state
      return rest;
    }}
  )
)
```

#### **Limit number of states stored**

For performance reasons, you may want to limit the number of previous and future states stored in history. Setting `limit` will limit the number of previous and future states stored in the `zundo` store. By default, no limit is set.

```tsx
const useStore = create<StoreState>(
  zundo(
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
  undoMiddleware(
    set => ({ ... }),
    { equality: shallow }
  )
);

const useStoreB = create<StoreState>(
  undoMiddleware(
    set => ({ ... }),
    { equality: (a, b) => a.field1 !== b.field1 }
  )
);
```

### Callback when temporal store is updated

Sometimes, you may need to call a function when the temporal store is updated. This can be configured using `onSave` in the options, or by programatically setting the callback if you need lexical context.


```tsx
import shallow from 'zustand/shallow'

const useStoreA = create<StoreState>(
  undoMiddleware(
    set => ({ ... }),
    { onSave: (state) => console.log('saved', state) }
  )
);
```

#### **Cool-off period**

Sometimes multiple state changes might happen in a short amount of time and you only want to store one change in history. Use `coolOffDurationMs` to set how long (in millesconds) to stop new changes from being stored in history after an initial change has happened.

Please note: Even if you don't set `coolOffDurationMs`, if multiple state changes happen inside of the same frame (e.g. you called `setSomething` multiple times in the same function call), only one item will be stored in history.

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


## API

### `store.temporal` 

Returns the default store. `getState`, `setState`, `subscribe`, etc.

### `TemporalState`

```tsx
export interface TemporalStateWithInternals<TState> {
  pastStates: TState[];
  futureStates: TState[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  trackingState: 'paused' | 'tracking';
  pause: () => void;
  resume: () => void;

  setOnSave: (onSave: onSave<TState>) => void;
  __internal: {
    onSave: onSave<TState>;
    handleUserSet: (pastState: TState) => void;
  };
}
```

### `create`

Create from `zundo` will return a store hook that has undo/redo capabilities. In addition to what fields are in the provided in your `StoreState`, the functions `undo`, `redo`, `clearUndoHistory`, and `getState` are added as well.

This works for multiple undoable stores in the same app.

- `undo`: call function to apply previous state (if there are previous states). Optionally pass a number of steps to undo.
- `redo`: call function to apply future state (if there are future states). Future states are "previous previous states." Optionally pass a number of steps to redo.
- `clear`: call function to remove all stored states from your undo store. _Warning:_ clearing cannot be undone.

Dispatching a new state will clear all of the future states.


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

PRs are welcome! [pnpm](https://pnpm.io/) is used as a package manager. Run `pnpm install` to install local dependencies. Libray code is locted at `packages/zundo`.

## Author

- Charles Kornoelje ([@\_charkour](https://twitter.com/_charkour)) - [Tekton](www.tekton.com)

## Versioning

View the [releases](https://github.com/charkour/zundo/releases) for the change log.

Publish using `np --no-cleanup`.

## Illustration Credits

- Ivo Ilić [@theivoson](https://twitter.com/theivoson)
