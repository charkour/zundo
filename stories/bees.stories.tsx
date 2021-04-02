import React, { useState } from 'react';
import { Meta, Story } from '@storybook/react';
import { undo, useUndo } from '../src';
import create from 'zustand';

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

// create a store with undo middleware
const useStoreWithUndo = create(
  undo(set => ({
    bees: 0,
    text: "",
    incrementBees: () => set(state => (state.bees += 1)),
    decrementBees: () => set(state => (state.bees -= 1)),
    submitText: text => set({ text })
  }))
);

const App = () => {
  const { prevActions, undo } = useUndo();
  const {
    bees,
    incrementBees,
    decrementBees,
    submitText,
    text
  } = useStoreWithUndo();
  const [inputText, setInputText] = useState("");

  return (
    <div>
      <h1>🐻 ♻️ Zustand undo!</h1>
      actions stack: {JSON.stringify(prevActions)}
      <br />
      <br />
      bees: {bees}
      <br />
      <button onClick={incrementBees}>incremenet</button>
      <button onClick={decrementBees}>decrement</button>
      <br />
      <br />
      <input value={inputText} onChange={e => setInputText(e.target.value)} />
      <br />
      <button onClick={() => submitText(inputText)}>submit text</button>
      <br />
      text: {text}
      <br />
      <button onClick={undo as any}>undo</button>
    </div>
  );
}

const Template: Story<{}> = args => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {};
