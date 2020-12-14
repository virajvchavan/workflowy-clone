import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test("renders without errors", () => {
  const { getByText } = render(<App />);
  expect(getByText("Moar")).not.toBeNull();
});
