import React from 'react';
import { Meta, Story } from '@storybook/react';
import create, { StoreApi, GetState } from 'zustand';
import { devtools, NamedSet, subscribeWithSelector } from 'zustand/middleware';

import { undoMiddleware, UndoState } from '../src';

const meta: Meta = {
  title: 'Other Middlewares',
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

export interface StoreState extends UndoState {
  bears: number;
  ignored: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  decreasePopulation: () => void;
  doNothing: () => void;
}

const storeWithoutDevtools = subscribeWithSelector<
  StoreState,
  NamedSet<StoreState>,
  GetState<StoreState>,
  StoreApi<StoreState>
>(
  undoMiddleware(
    (set) => ({
      bears: 0,
      ignored: 0,
      increasePopulation: () =>
        set(
          (state) => ({
            bears: state.bears + 1,
            ignored: state.ignored + 1,
          }),
          false,
          'increasePopulation',
        ),
      decreasePopulation: () =>
        set(
          (state) => ({
            bears: state.bears - 1,
            ignored: state.ignored - 1,
          }),
          false,
          'decreasePopulation',
        ),
      doNothing: () => set((state) => ({ ...state })),
      removeAllBears: () => set({ bears: 0 }),
    }),
    { exclude: ['ignored'], historyDepthLimit: 10 },
  ),
);

// create a store with undo middleware
const useStore = create(devtools(storeWithoutDevtools));

const App = () => {
  const store = useStore();
  const {
    bears,
    ignored,
    increasePopulation,
    removeAllBears,
    decreasePopulation,
    undo,
    clear,
    redo,
    setIsUndoHistoryEnabled,
    getState,
    doNothing,
  } = store;

  return (
    <div>
      <h1>🐻 ♻️ Zundo!</h1>
      previous states: {JSON.stringify(getState && getState().prevStates)}
      <br />
      {/* TODO: make the debug testing better */}
      future states: {JSON.stringify(getState && getState().futureStates)}
      <br />
      current state: {JSON.stringify(store)}
      <br />
      bears: {bears}
      <br />
      ignored: {ignored}
      <br />
      <button type="button" onClick={increasePopulation}>
        increase
      </button>
      <button
        type="button"
        onClick={() => {
          increasePopulation();
          increasePopulation();
          increasePopulation();
        }}
      >
        increase +3
      </button>
      <button type="button" onClick={decreasePopulation}>
        decrease
      </button>
      <button type="button" onClick={removeAllBears}>
        remove
      </button>
      <br />
      <button type="button" onClick={undo}>
        undo
      </button>
      <button type="button" onClick={redo}>
        redo
      </button>
      <br />
      <button type="button" onClick={clear}>
        clear
      </button>
      <br />
      <button
        type="button"
        onClick={() => {
          setIsUndoHistoryEnabled?.(false);
        }}
      >
        Disable History
      </button>
      <button
        type="button"
        onClick={() => {
          setIsUndoHistoryEnabled?.(true);
        }}
      >
        Enable History
      </button>
      <br />
      <button type="button" onClick={doNothing}>
        do nothing
      </button>
    </div>
  );
};

const Template: Story<{}> = (args) => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
