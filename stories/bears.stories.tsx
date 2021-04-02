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
}

// create a store with undo middleware
const useStore = create<StoreState>(
  undo(set => ({
    bears: 0,
    increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
    removeAllBears: () => set({ bears: 0 }),
  }))
);

const App = () => {
  const { prevStates, undo } = useUndo();
  const { bears, increasePopulation, removeAllBears } = useStore();

  return (
    <div>
      <h1>🐻 ♻️ Zundo!</h1>
      previous states: {JSON.stringify(prevStates)}
      <br />
      <br />
      bears: {bears}
      <br />
      <button onClick={increasePopulation}>increase</button>
      <button onClick={removeAllBears}>remove</button>
      <br />
      <button onClick={undo}>undo</button>
    </div>
  );
};

const Template: Story<{}> = args => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
