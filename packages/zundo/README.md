# 🍜 Zundo

enable time-travel in your apps. undo/redo middleware for [zustand](https://github.com/pmndrs/zustand). built with zustand. <1kB

![gif displaying undo feature](https://github.com/charkour/zundo/raw/v0.2.0/zundo.gif)

[![Build Size](https://img.shields.io/bundlephobia/minzip/zundo/beta?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=zundo)
[![Version](https://img.shields.io/npm/v/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)
[![Downloads](https://img.shields.io/npm/dt/zundo?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zundo)

Try a live [demo](https://codesandbox.io/s/currying-flower-2dom9?file=/src/App.tsx)

## Install

```sh
npm i zustand zundo
```

> zustand v4.3.0 or higher is required for TS usage. v4.0.0 or higher is required for JS usage.

## Background

- Solves the issue of managing state in complex user applications
- Provides simple middleware to add undo/redo capabilities
- Leverages zustand for state management, keeping the internals small
- Works with multiple stores in the same app
- Has an unopinionated and extensible API

<div style="width: 100%; display: flex;">
<img src="https://github.com/charkour/zundo/blob/main/zundo-mascot.png" style="margin: auto;" alt="Bear wearing a button up shirt textured with blue recycle symbols eating a bowl of noodles with chopsticks." width=300 />
</div>

## First create a vanilla store with temporal middleware

This returns the familiar store accessible by a hook! But now your store tracks past actions.

```tsx
import { temporal } from 'zundo'
import { create } from 'zustand'

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

## Convert to React Store

If you're using React, you can convert the store to a React hook using create from `zustand`.

```tsx
import { useStore } from 'zustand'
import type { TemporalState } from 'zundo'

const useTemporalStore = <T,>(
  selector: (state: TemporalState<StoreState>) => T,
  equality?: (a: T, b: T) => boolean,
) => useStore(originalStore.temporal, selector, equality);
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
  } = useTemporalStore((state) => state);
  // or if you don't use create from zustand, you can use the store directly
  // } = useStoreWithUndo.temporal.getState();

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

## API

### The Middleware

`(config: StateCreator, options?: ZundoOptions) => StateCreator`

zundo has one export: `temporal` It is used to as middleware for `create` from zustand. The `config` parameter is your store created by zustand. The second `options` param is optional and has the following API.

### Middleware Options

```tsx
type onSave<TState> = (pastState: TState, currentState: TState) => void;

export interface ZundoOptions<TState, PartialTState = TState> {
  partialize?: (state: TState) => PartialTState;
  limit?: number;
  equality?: (currentState: TState, pastState: TState) => boolean;
  onSave?: onSave<TState>;
  handleSet?: (
    handleSet: StoreApi<TState>['setState'],
  ) => StoreApi<TState>['setState'];
}
```

#### **Exclude fields from being tracked in history**

`partialize?: (state: TState) => PartialTState`

Use the `partialize` option to omit or include specific fields. Pass a callback that returns the desired fields. This can also be used to exclude fields. By default, the entire state object is tracked.

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

`limit?: number`

For performance reasons, you may want to limit the number of previous and future states stored in history. Setting `limit` will limit the number of previous and future states stored in the `temporal` store. When the limit is reached, the oldest state is dropped. By default, no limit is set.

```tsx
const useStore = create<StoreState>(
  temporal(
    set => ({ ... }),
    { limit: 100 }
  )
);
```

#### **Prevent unchanged states to be stored**

`equality?: (currentState: TState, pastState: TState) => boolean`

For performance reasons, you may want to use a custom `equality` function to determine when a state change should be tracked. You can write your own or use something like `lodash/deepEqual` or `zustand/shallow`. By default, all state changes to your store are tracked.

```tsx
import { shallow } from 'zustand/shallow'

// Use an existing equality function
const useStoreA = create<StoreState>(
  temporal(
    set => ({ ... }),
    { equality: shallow }
  )
);

// Write your own equality function
const useStoreB = create<StoreState>(
  temporal(
    set => ({ ... }),
    { equality: (a, b) => a.field1 !== b.field1 }
  )
);
```

#### **Callback when temporal store is updated**

`onSave?: (pastState: TState, currentState: TState) => void`

Sometimes, you may need to call a function when the temporal store is updated. This can be configured using `onSave` in the options, or by programmatically setting the callback if you need lexical context (see the `TemporalState` API below for more information).

```tsx
import { shallow } from 'zustand/shallow'

const useStoreA = create<StoreState>(
  temporal(
    set => ({ ... }),
    { onSave: (state) => console.log('saved', state) }
  )
);
```

#### **Cool-off period**

`handleSet?: (handleSet: StoreApi<TState>['setState']) => StoreApi<TState>['setState']`

Sometimes multiple state changes might happen in a short amount of time and you only want to store one change in history. To do so, we can utilize the `handleSet` callback to set a timeout to prevent new changes from being stored in history. This can be used with something like `lodash.throttle` or `debounce`. This a way to provide middleware to the temporal store's setter function.

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

When using zustand with the `temporal` middleware, a `temporal` object is attached to your vanilla or React-based store. `temporal` is a vanilla zustand store: see [StoreApi<T> from](https://github.com/pmndrs/zustand/blob/f0ff30f7c431f6bf25b3cb439d065a7e61355df4/src/vanilla.ts#L8) zustand for more details.

Use `temporal.getState()` to access to temporal store!

> While `setState`, `subscribe`, and `destory` exist on `temporal`, you should not need to use them.

#### **React Hooks**

To use within React hooks, we need to convert the vanilla store to a React-based store using `create` from `zustand`. This is done by passing the vanilla store to `create` from `zustand`.

```tsx
import { create } from 'zustand';
import { temporal } from 'zundo';

const useStore = create(
  temporal(
    set => ({ ... }),
    { ... }
  )
);

const useTemporalStore = create(useStore.temporal);
```

### `useStore.temporal.getState()`

`temporal.getState()` returns the `TemporalState` which contains `undo`, `redo`, and other helpful functions and fields.

```tsx
interface TemporalState<TState> {
  pastStates: TState[];
  futureStates: TState[];

  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;

  trackingStatus: 'paused' | 'tracking';
  pause: () => void;
  resume: () => void;

  setOnSave: (onSave: onSave<TState>) => void;
}
```

#### **Going back in time**

`pastStates: TState[]`

`pastStates` is an array of previous states. The most recent previous state is at the end of the array. This is the state that will be applied when `undo` is called.

#### **Forward to the future**

`futureStates: TState[]`

`futureStates` is an array of future states. States are added when `undo` is called. The most recent future state is at the end of the array. This is the state that will be applied when `redo` is called. The future states are the "past past states."

#### **Back it up**

`undo: (steps?: number) => void`

`undo`: call function to apply previous state (if there are previous states). Optionally pass a number of steps to undo to go back multiple state at once.

#### **Take it back now y'all**

`redo: (steps?: number) => void`

`redo`: call function to apply future state (if there are future states). Future states are "previous previous states." Optionally pass a number of steps to redo go forward multiple states at once.

#### **Remove all knowledge of time**

`clear: () => void`

`clear`: call function to remove all stored states from your undo store. Sets `pastStates` and `futureStates` to arrays with length of 0. _Warning:_ clearing cannot be undone.

**Dispatching a new state will clear all of the future states.**

#### **Stop and start history**

`trackingStatus: 'paused' | 'tracking'`

`trackingStatus`: a stateful string in the `temporal` store that indicates whether the `temporal` store is tracking state changes or not. Possible values are `'paused'` or `'tracking'`. To programmatically pause and resume tracking, use `pause()` and `resume()` explained below.

#### **Pause tracking of history**

`pause: () => void`

`pause`: call function to pause tracking state changes. This will prevent new states from being stored in history within the temporal store.

#### **Resume tracking of history**

`resume: () => void`

`resume`: call function to resume tracking state changes. This will allow new states to be stored in history within the temporal store.

#### **Programmatically add middleware to the setter**

`setOnSave: (onSave: (pastState: State, currentState: State) => void) => void`

`setOnSave`: call function to set a callback that will be called when the temporal store is updated. This can be used to call the temporal store setter using values from the lexical context. This is useful when needing to throttle or debounce updates to the temporal store.

## Examples

- [Basic](https://codesandbox.io/s/currying-flower-2dom9?file=/src/App.tsx)
- [SubscribeWithSelector](https://codesandbox.io/s/zundo-with-subscribe-with-selector-forked-mug69t)
- [canUndo, canRedo, undoDepth, redoDepth](https://codesandbox.io/s/zundo-canundo-and-undodepth-l6jclx?file=/src/App.tsx:572-731)

## Migrate from v1 to v2

<details>
<summary>Click to expand</summary>

This is a work in progress. Submit a PR!

</details>

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

Charles Kornoelje ([@\_charkour](https://twitter.com/_charkour))

## Versioning

View the [releases](https://github.com/charkour/zundo/releases) for the change log.

## Illustration Credits

Ivo Ilić ([@theivoson](https://twitter.com/theivoson))
