import { cleanup, render } from '@testing-library/react';
import React from "react";
import RootNotes from '../RootNote';
import * as utils from '../utils';
import { SyncedDataResponse } from '../utils';

afterEach(cleanup);

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

let emptySyncChangesResponse: SyncedDataResponse = {
  status: "success",
  newNoteIds: []
}

test("it should have the Add btn", async () => {
  jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => someNotes );
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse );
  const { findByText } = render(<RootNotes />);
  let res = await findByText("+");
  expect(res).not.toBeNull();
});

test("it should render initial notes correctly when max level is 1", async () => {
  jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => someNotes );
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse );
  const { findByText } = render(<RootNotes />);
  let note1 = await findByText("one");
  expect(note1).not.toBeNull();
  expect(note1.id).toBe("note.0");

  let note2 = await findByText("two");
  expect(note2).not.toBeNull();
  expect(note2.id).toBe("note.1");

  let note3 = await findByText("three");
  expect(note3).not.toBeNull();
  expect(note3.id).toBe("note.2");
});

test("it should render initial notes correctly when max level is more than 1", async () => {
  let notes = [
    {"content":"one","child_notes":[],"collapsed":false,"id":"1"},
    {"content":"two","child_notes":[{"content":"three","child_notes":[
      {"content":"four","child_notes":[],"collapsed":false,"id":"4"}
    ],"collapsed":false,"id":"3"}],"collapsed":false,"id":"2"},
  ]
  jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => notes);
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse );
  const { findByText } = render(<RootNotes />);
  let note1 = await findByText("one");
  expect(note1).not.toBeNull();
  expect(note1.id).toBe("note.0");

  let note2 = await findByText("two");
  expect(note2).not.toBeNull();
  expect(note2.id).toBe("note.1");

  let note3 = await findByText("three");
  expect(note3).not.toBeNull();
  expect(note3.id).toBe("note.1.0");

  let note4 = await findByText("four");
  expect(note4).not.toBeNull();
  expect(note4.id).toBe("note.1.0.0");
});

// add tests for collapsing logic

// add tests for adding a new note at root level
  // - when the note is collapsed
  // - when the note is not collapsed

// add test for adding a new note for some parent

// add test for adding a new note as the first child
// as the last child
// as a middle chlid

// add test for tab behaviour
  // - when the sibling before it exists
  // - when the sibling before does not exist

// add test for shift + tab behaviour

// add test for deleting a note (backspace when empty)
