# 🍜 Zundo

Undo middleware for [zustand](https://github.com/pmndrs/zustand); built with zustand. 

[![Build Size](https://img.shields.io/bundlephobia/min/zundo?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=zundo)
[![Version](https://img.shields.io/npm/v/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)

![zundo demo](./zundo.gif)

See a [demo](https://codesandbox.io/s/currying-flower-2dom9?file=/src/App.tsx)

## Install

```sh
npm i zundo
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
  const { undo } = useUndo();
  const { bears, increasePopulation, removeAllBears } = useStore();

  return (
    <>
      bears: {bears}
      <button onClick={increasePopulation}>increase</button>
      <button onClick={removeAllBears}>remove</button>
      <button onClick={undo}>undo</button>
    </>
  );
};
```

## Road Map

- add redo. probably with index to traverse through prevStates
- possibly use better data structure for storing prevous states. Maybe just a diff between states?
- clean up api? return `undo` with the store hook?

## Contributing

Issues and PRs are welcome. I'd like to hear your comments and critiques. We can discuss ways to make this package better. Thanks :)
