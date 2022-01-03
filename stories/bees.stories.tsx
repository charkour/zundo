import React, { useState } from 'react';
import { Meta, Story } from '@storybook/react';
import create from 'zustand';
import { UndoState } from '../src';
import undoMiddleware from '../src/middleware';

const meta: Meta = {
  title: 'bees',
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
  ignored: number;
  bees: number;
  text: string;
  incrementBees: () => void;
  decrementBees: () => void;
  submitText: (text: string) => void;
}

// create a store with undo middleware
const useStoreWithUndo = create<StoreState>(
  undoMiddleware(
    (set) => ({
      ignored: 0,
      bees: 0,
      text: '',
      incrementBees: () =>
        set((state) => ({ bees: state.bees + 1, ignored: state.ignored + 1 })),
      decrementBees: () =>
        set((state) => ({ bees: state.bees - 1, ignored: state.ignored - 1 })),
      submitText: (text) => set({ text }),
    }),
    { include: ['bees', 'text'] },
  ),
);

const App = () => {
  const {
    bees,
    ignored,
    incrementBees,
    decrementBees,
    submitText,
    text,
    undo,
    getState,
  } = useStoreWithUndo();
  const [inputText, setInputText] = useState('');

  return (
    <div>
      <h1>🐻 ♻️ Zustand undo!</h1>
      actions stack: {JSON.stringify(getState && getState().prevStates)}
      <br />
      <br />
      bees: {bees}
      <br />
      ignored: {ignored}
      <br />
      <button type="button" onClick={incrementBees}>
        incremenet
      </button>
      <button type="button" onClick={decrementBees}>
        decrement
      </button>
      <br />
      <br />
      <input value={inputText} onChange={(e) => setInputText(e.target.value)} />
      <br />
      <button type="button" onClick={() => submitText(inputText)}>
        submit text
      </button>
      <br />
      text: {text}
      <br />
      <button type="button" onClick={undo}>
        undo
      </button>
    </div>
  );
};

const Template: Story<{}> = (args) => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
