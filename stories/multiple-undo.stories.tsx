import React, { useState } from 'react';
import { Meta, Story } from '@storybook/react';
import create, { UseBoundStore, UndoState } from '../src';

const meta: Meta = {
  title: 'multiple undo stores',
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

interface StoreState {
  bees: number;
  text: string;
  incrementBees: () => void;
  decrementBees: () => void;
  submitText: (text: string) => void;
}

const useStoreWithUndo = create<StoreState>((set) => ({
  bees: 0,
  text: '',
  incrementBees: () => set((state) => ({ bees: state.bees + 1 })),
  decrementBees: () => set((state) => ({ bees: state.bees - 1 })),
  submitText: (text) => set({ text }),
}));

const useStoreWithUndo2 = create<StoreState>((set) => ({
  bees: 0,
  text: '',
  incrementBees: () => set((state) => ({ bees: state.bees + 1 })),
  decrementBees: () => set((state) => ({ bees: state.bees - 1 })),
  submitText: (text) => set({ text }),
}));

interface SectionProps {
  useStore: UseBoundStore<StoreState & UndoState<StoreState>>;
}

const Section = ({ useStore }: SectionProps) => {
  const { bees, incrementBees, decrementBees, submitText, text, zundo } =
    useStore();
  const [inputText, setInputText] = useState('');

  return (
    <div>
      <h1>🐻 ♻️ Zustand undo!</h1>
      actions stack: {JSON.stringify(zundo?.getState().prevStates)}
      <br />
      past actions stack: {JSON.stringify(zundo?.getState().futureStates)}
      <br />
      <br />
      bees: {bees}
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
      <button type="button" onClick={zundo?.undo}>
        undo
      </button>
      <button type="button" onClick={zundo?.redo}>
        redo
      </button>
    </div>
  );
};

const App = () => (
  <>
    <Section useStore={useStoreWithUndo} />
    <Section useStore={useStoreWithUndo2} />
  </>
);

const Template: Story<{}> = (args) => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
