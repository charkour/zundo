import React from 'react';
import { Meta, Story } from '@storybook/react';
import { undoMiddleware, UndoState } from '../src';
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

interface StoreState extends UndoState {
  bears: number;
  ignored: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  decreasePopulation: () => void;
  doNothing: () => void;
}

// create a store with undo middleware
const useStore = create<StoreState>(
  undoMiddleware(
    set => ({
      bears: 0,
      ignored: 0,
      increasePopulation: () =>
        set(state => ({ bears: state.bears + 1, ignored: state.ignored + 1 })),
      decreasePopulation: () =>
        set(state => ({ bears: state.bears - 1, ignored: state.ignored - 1 })),
      doNothing: () => set(state  => ({ ...state })),
      removeAllBears: () => set({ bears: 0 }),
    }),
    { omit: ['ignored'] }
  )
);

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
      <br />
      bears: {bears}
      <br />
      ignored: {ignored}
      <br />
      <button onClick={increasePopulation}>increase</button>
      <button onClick={decreasePopulation}>decrease</button>
      <button onClick={removeAllBears}>remove</button>
      <br />
      <button onClick={undo}>undo</button>
      <button onClick={redo}>redo</button>
      <br />
      <button onClick={clear}>clear</button>
      <br />
      <button onClick={doNothing}>do nothing</button>
    </div>
  );
};

const Template: Story<{}> = args => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
