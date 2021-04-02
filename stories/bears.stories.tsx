import React from 'react';
import { Meta, Story } from '@storybook/react';
import { undo, useUndo } from '../src';
import create from 'zustand';

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

// create a store with undo middleware
const useStore = create(
  undo(set => ({
    bears: 0,
    increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
    removeAllBears: () => set({ bears: 0 }),
  }))
);

const App = () => {
  const { prevActions, undo } = useUndo();
  const { bears, increasePopulation, removeAllBears } = useStore();

  return (
    <div>
      <h1>🐻 ♻️ Zundo!</h1>
      previous actions: {JSON.stringify(prevActions)}
      <br />
      <br />
      bears: {bears}
      <br />
      <button onClick={increasePopulation}>increase</button>
      <button onClick={removeAllBears}>remove</button>
      <br />
      <button onClick={undo as any}>undo</button>
    </div>
  );
};

const Template: Story<{}> = args => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
