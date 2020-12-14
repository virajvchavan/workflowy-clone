import { cleanup, render } from '@testing-library/react';
import React from "react";
import RootNotes from '../RootNote';
import * as utils from '../utils';

// afterEach(cleanup);

jest.mock('../../../hooks/use-auth.tsx', () => ({
  useAuth: () => {
    return {
      loading: false,
      user: { name: "TestUser", token: "fakeAuthToken" },
      signin: jest.fn(),
      signout: jest.fn(),
      signup: jest.fn()
    }
  }
}));

let someNotes = [
  {"content":"one","child_notes":[],"collapsed":false,"id":"1"},
  {"content":"two","child_notes":[],"collapsed":false,"id":"2"},
  {"content":"three","child_notes":[],"collapsed":false,"id":"3"}
];

test("it should have the Add btn", async () => {
  jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => someNotes );
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => {
    return {
      status: "success",
      newNoteIds: []
    }
  } );
  const { findByText } = render(<RootNotes />);
  let res = await findByText("+");
  expect(res).not.toBeNull();
});
