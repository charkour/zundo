import React from 'react';
import ReactDOM from 'react-dom';
import { Default as App } from '../stories/bears.stories';

describe('App', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<App />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
