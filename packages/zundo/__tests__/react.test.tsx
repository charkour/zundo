import { describe, it, expect } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Reactive from '../../../apps/web/pages/reactive';

describe('React Re-renders when state changes', () => {
  it('it', () => {
    const { queryByLabelText, getByLabelText, queryByText, getByText } = render(
      <Reactive />,
    );

    expect(queryByText(/bears: 0/i)).toBeTruthy();
    expect(queryByText(/increment/i)).toBeTruthy();
    expect(queryByText(/past states: \[\]/i)).toBeTruthy();
    expect(queryByText(/future states: \[\]/i)).toBeTruthy();

    const incrementButton = getByText(/increment/i);
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);

    expect(queryByText(/bears: 2/i)).toBeTruthy();
    expect(
      queryByText(/past states: \[{"bears":0},{"bears":1}\]/i),
    ).toBeTruthy();
    expect(queryByText(/future states: \[\]/i)).toBeTruthy();

    expect(
      queryByText(/undo/i, {
        selector: 'button',
      }),
    ).toBeTruthy();

    const undoButton = getByText(/undo/i, {
      selector: 'button',
    });

    fireEvent.click(undoButton);
    fireEvent.click(undoButton);

    expect(queryByText(/bears: 0/i)).toBeTruthy();
    expect(queryByText(/past states: \[\]/i)).toBeTruthy();
    expect(
      queryByText(/future states: \[{"bears":2},{"bears":1}\]/i),
    ).toBeTruthy();
  });
});
