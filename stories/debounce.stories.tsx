import React from 'react';
import { Meta, Story } from '@storybook/react';
import { undoMiddleware, UndoState } from '../src';
import create from 'zustand';

const meta: Meta = {
  title: 'debounce',
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
    { coolOffDurationMs: 3000 }
  )
);

const App = () => {
  const store = useStore();
  const {
    bears,
    increasePopulation,
    undo,
    clear,
    redo,
    getState,
  } = store;

  return (
    <div>
      <h1>🐻 ♻️ Zundo! (3 second debounce)</h1>
      previous states: {JSON.stringify(getState && getState().prevStates)}
      <br />
      {/* TODO: make the debug testing better */}
      future states: {JSON.stringify(getState && getState().futureStates)}
      <br />
      current state: {JSON.stringify(store)}
      <br />
      bears: {bears}
      <br />
      <button onClick={increasePopulation}>increase</button>
      <button onClick={() => {
        increasePopulation()
        increasePopulation()
        increasePopulation()
      }}>increase +3</button>
      <br />
      <button onClick={undo}>undo</button>
      <button onClick={redo}>redo</button>
      <br />
      <button onClick={clear}>clear</button>
    </div>
  );
};

const Template: Story<{}> = (args) => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
