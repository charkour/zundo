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
import create from 'zustand';
import { undo, useUndo } from 'zundo';

const useStore = create(
  undo(set => ({
    bears: 0,
    increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
    removeAllBears: () => set({ bears: 0 }),
  }))
);
```

## Then bind your components

Use your store anywhere and get undo from `zundo` and add it to a button to go backwards in time!

```tsx
const App = () => {
  const { undo, redo, clear } = useUndo();
  const { bears, increasePopulation, removeAllBears } = useStore();

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

## API

### `undo()`

Middleware for Zustand to add the ability to time travel through states.

```tsx
import create from 'zustand';
import { undo } from 'zundo';

const useStore = create(
  undo((set, get, api) => ({ ... }))
);
```

### `useUndo()`

Hook that provides reference to a store containing actions that undo/redo states for your main store when called.

```tsx
const { undo, redo, clear } = useUndo();
```

- `undo`: call function to apply previous state (if there are previous states)
- `redo`: call function to apply future state (if there are future states). Future states are "previous previous states."
- `clear`; call function to remove all stored states from your undo store. _Warning:_ clearing cannot be undone.

Dispatching a new state will clear all of the future states.

## Road Map

- possibly use better data structure for storing previous states. Maybe just a diff between states?
- clean up api? return `undo` with the store hook?

## Contributing

Issues and PRs are welcome. I'd like to hear your comments and critiques. We can discuss ways to make this package better. Thanks :)
