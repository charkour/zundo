import React from 'react';
import { Meta, Story } from '@storybook/react';
import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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
  increasePopulation: () => void;
}

// create a store with undo middleware
const useStore = create<StoreState>()(
  subscribeWithSelector(
    undoMiddleware(
      immer((set) => ({
        bears: 0,
        increasePopulation: () =>
          set((state) => {
            // eslint-disable-next-line no-param-reassign
            state.bears += 1;
          }),
      })),
    ),
  ),
);

const App = () => {
  const { increasePopulation, bears } = useStore();

  const { undo, redo, clear, setIsUndoHistoryEnabled, getState } =
    useStore.zundo;

  return (
    <div>
      <h1>🐻 ♻️ Zundo!</h1>
      previous states: {JSON.stringify(getState().prevStates)}
      <br />
      {/* TODO: make the debug testing better */}
      future states: {JSON.stringify(getState().futureStates)}
      <br />
      bears: {bears}
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
          setIsUndoHistoryEnabled(false);
        }}
      >
        Disable History
      </button>
      <button
        type="button"
        onClick={() => {
          setIsUndoHistoryEnabled(true);
        }}
      >
        Enable History
      </button>
    </div>
  );
};

const Template: Story<{}> = (args) => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
