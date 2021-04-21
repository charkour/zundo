import React from 'react';
import { Meta, Story } from '@storybook/react';
import { undo, useUndo } from '../src';
import create, { State } from 'zustand';

const meta: Meta = {
  title: 'bears',
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

interface StoreState extends State {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  decreasePopulation: () => void;
}

// create a store with undo middleware
const useStore = create<StoreState>(
  undo<StoreState>(set => ({
    bears: 0,
    increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
    decreasePopulation: () => set(state => ({ bears: state.bears - 1 })),
    removeAllBears: () => set({ bears: 0 }),
  }))
);

const App = () => {
  const { prevStates, undo, futureStates, redo, clear } = useUndo();
  const store = useStore();
  const {
    bears,
    increasePopulation,
    removeAllBears,
    decreasePopulation,
  } = store;

  return (
    <div>
      <h1>🐻 ♻️ Zundo!</h1>
      previous states: {JSON.stringify(prevStates)}
      <br />
      future states: {JSON.stringify(futureStates)}
      <br />
      current state: {JSON.stringify(store)}
      <br />
      <br />
      bears: {bears}
      <br />
      <button onClick={increasePopulation}>increase</button>
      <button onClick={decreasePopulation}>decrease</button>
      <button onClick={removeAllBears}>remove</button>
      <br />
      <button onClick={undo}>undo</button>
      <button onClick={redo}>redo</button>
      <br />
      <button onClick={clear}>clear</button>
    </div>
  );
};

const Template: Story<{}> = args => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
