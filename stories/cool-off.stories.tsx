import React from 'react';
import { Meta, Story } from '@storybook/react';
import create from 'zustand';
import { undoMiddleware, UndoState } from '../src';

const meta: Meta = {
  title: 'Cool Off',
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
export const useStore = create<StoreState>(
  undoMiddleware(
    (set) => ({
      bears: 0,
      increasePopulation: () =>
        set((state) => ({
          bears: state.bears + 1,
        })),
    }),
    { coolOffDurationMs: 3000 },
  ),
);

const App = function () {
  const store = useStore();
  const { bears, increasePopulation, undo, clear, redo, getState } = store;

  return (
    <div>
      <h1>🐻 ♻️ Zundo! (3 second cool-off)</h1>
      previous states: {JSON.stringify(getState && getState().prevStates)}
      <br />
      {/* TODO: make the debug testing better */}
      future states: {JSON.stringify(getState && getState().futureStates)}
      <br />
      current state: {JSON.stringify(store)}
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
    </div>
  );
};

const Template: Story<{}> = function (args) {
  return <App {...args} />;
};

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
