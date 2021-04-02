# 🍜 Zundo

Undo middleware for your favorite, comfy state-management solution: [zustand](https://github.com/pmndrs/zustand).

## Install

```sh
npm i zundo
```

## First create a store with undo middleware

This returns the familiar store accessible by a hook! But now your store tacks past actions.

```tsx
import { undo, useUndo } from 'zundo';
import create from 'zustand';

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

- add redo
- typescript support
- clean up api? return `undo` with the store hook?

## Contributing

Issues and PRs are welcome. I'd like to hear your comments and critiques. We can discuss ways to make this package better. Thanks :)
