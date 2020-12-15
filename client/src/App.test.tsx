import React from 'react';
import { render, screen, getByText } from '@testing-library/react';
import App from './App';
import userEvent from '@testing-library/user-event';

test("it should show important elements when user is not logged in yet.", () => {
  const { getByText } = render(<App />);
  expect(getByText("Moar")).not.toBeNull();
  expect(getByText("Login")).not.toBeNull();
});

test("it should render Login component when login btn is clicked", async () => {
  const { getByRole, findByText } = render(<App />);
  userEvent.click(getByRole("button"));
  await findByText("Log in to an existing account");
});

test("it should render Signup component when Signup btn is clicked on the Login page", async () => {
  const { findByText } = render(<App />);
  userEvent.click(await findByText("Create a new account"));
  let h3Tag = await findByText("Create a new account");
  expect(h3Tag.tagName).toBe("H3");
});
