import { cleanup, render, waitFor, getByText, getByTestId } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  expect(note1.id).toBe("note.0");

  let note2 = await findByText("two");
  expect(note2.id).toBe("note.1");

  let note3 = await findByText("three");
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
  expect(note1.id).toBe("note.0");

  let note2 = await findByText("two");
  expect(note2.id).toBe("note.1");

  let note3 = await findByText("three");
  expect(note3.id).toBe("note.1.0");

  let note4 = await findByText("four");
  expect(note4.id).toBe("note.1.0.0");
});

// add tests for collapsing logic
test("it should not render children of a collapsed note", async () => {
  let notes = [
    {"content":"two","child_notes":[{"content":"three","child_notes": [],"collapsed":false,"id":"3"}],"collapsed":true,"id":"2"},
  ]
  jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => notes);
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse );
  const { queryByText, findByText } = render(<RootNotes />);

  await waitFor(() => findByText("two"));
  expect(queryByText("three")).toBeNull();
});

// test("it should collapse child notes after clicking on the collapse arrow", async () => {
//   jest.useFakeTimers();
//   let notes = [
//     {"content":"two","child_notes":[{"content":"three","child_notes": [],"collapsed":false,"id":"3"}],"collapsed":false,"id":"2"},
//   ]
//   jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => notes);
//   jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse );

//   const { queryByText, findByText, getByTestId } = render(<RootNotes />);
//   await waitFor(() => findByText("two"));
//   expect(queryByText("three")).not.toBeNull();

//   // using setTimeout not the best idea here, but I couldn't get 'wait' or 'waitFor' to work here
//   await act(async () => {
//     userEvent.click(getByTestId("collapseBtn.0"));
//   });
//   setTimeout(() => {
//     expect(queryByText("three")).toBeNull();
//   }, 1000);

//   // click again
//   await act(async () => {
//     userEvent.click(getByTestId("collapseBtn.0"));
//   });
//   // the child notes should be back
//   setTimeout(() => {
//     expect(queryByText("three")).not.toBeNull();
//   }, 1000);
// });

test("it should add a new note at root level when + btn is clicked", async () => {
  let notes = [
    {"content":"two","child_notes":[{"content":"three","child_notes": [],"collapsed":false,"id":"3"}],"collapsed":false,"id":"2"},
  ]
  jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => notes);
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse );

  const { findByTestId, findByText } = render(<RootNotes />);
  let addBtn = await findByText("+");
  userEvent.click(addBtn);
  let note = await findByTestId("noterow.1");
  expect(note).not.toBeNull();
});

test("it should add a new note at root level when enter key is pressed on a root note with no child notes", async () => {
  let notes = [
    {"content":"one","child_notes":[],"collapsed":false,"id":"1"},
  ]
  jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => notes);
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse );

  const { findByTestId, findByText } = render(<RootNotes />);
  let note1 = await waitFor(() => findByText("one"));
  userEvent.type(note1, '{enter}');
  let note = await findByTestId("noterow.1");
  expect(note).not.toBeNull();
});

test("it should add a new note at root level when enter key is pressed on a root note with collapsed child notes", async () => {
  let notes = [
    {"content":"one","child_notes":[{"content":"two","child_notes": [],"collapsed":false,"id":"2"}],"collapsed":true,"id":"1"},
  ]
  jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => notes);
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse );

  const { findByTestId, findByText } = render(<RootNotes />);
  let note1 = await waitFor(() => findByText("one"));
  userEvent.type(note1, '{enter}');
  let note = await findByTestId("noterow.1");
  expect(note).not.toBeNull();
});

test("it should add a new note as the first child when enter key is pressed on a root note with non-collapsed child notes", async () => {
  let notes = [
    {"content":"one","child_notes":[{"content":"two","child_notes": [],"collapsed":false,"id":"2"}],"collapsed":false,"id":"1"},
  ]
  jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => notes);
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse );

  const { findByTestId, findByText } = render(<RootNotes />);
  let note1 = await waitFor(() => findByText("one"));
  userEvent.type(note1, '{enter}');
  let note = await findByTestId("noterow.0.1");
  expect(note).toHaveTextContent("two");
});


test("it should add a new note at the correct index when enter key pressed in some middle note", async () => {
  let notes = [
    {"content":"one","child_notes":[],"collapsed":false,"id":"1"},
    {"content":"two","child_notes":[],"collapsed":false,"id":"2"},
  ]
  jest.spyOn(utils, 'fetchAllNotes').mockImplementation(async () => notes);
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse );

  const { findByTestId, findByText, getByText, getByTestId } = render(<RootNotes />);
  let note1 = await waitFor(() => findByText("one"));
  userEvent.type(note1, '{enter}');

  let note = await findByTestId("noterow.2");
  expect(note.querySelector("pre")).toHaveTextContent("two");
});

// add test for adding a new note for some parent

// add test for adding a new note as the first child
// as the last child
// as a middle chlid

// add test for tab behaviour
  // - when the sibling before it exists
  // - when the sibling before does not exist

// add test for shift + tab behaviour

// add test for deleting a note (backspace when empty)
