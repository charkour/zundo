import React from 'react';
import { Meta, Story } from '@storybook/react';
import create from 'zustand';
import { undoMiddleware } from '../src';

const meta: Meta = {
  title: 'new',
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

interface MyState {
  trees: number;
  increase: (by: number) => void;
}

// create a store with undo middleware
const useStore = create(
  undoMiddleware<MyState>(
    (set) => ({
      trees: 0,
      increase: (by: number) => set((state) => ({ trees: state.trees + by })),
    }),
    { historyDepthLimit: 10, include: ['trees'] },
  ),
);

const App = () => {
  const store = useStore();
  const { zundo, increase, trees } = store;

  return (
    <div>
      <p>Trees: {trees} </p>
      <button onClick={() => increase(1)} type="button">
        +
      </button>
      <button onClick={zundo?.undo} type="button">
        undo
      </button>
    </div>
  );
};

const Template: Story<{}> = (args) => <App {...args} />;

export const Default = Template.bind({});

Default.args = {};
