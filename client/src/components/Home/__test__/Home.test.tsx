import { cleanup, render } from '@testing-library/react';
import React from "react";
import Home from '../Home';
import * as utils from '../../Notes/utils';
import * as serverApis from '../../Notes/serverApis';
import { SyncedDataResponse } from '../../Notes/utils';
import { NotesType } from '../../Notes/Notes';

afterEach(cleanup);

let someNotes = [{"content":"one","child_notes":[],"collapsed":false,"id":"1"},];

let emptySyncChangesResponse: SyncedDataResponse = {
  status: "success",
  newNoteIds: []
}

function mockApiCalls(notes: NotesType[]) {
  jest.spyOn(serverApis, 'fetchAllNotes').mockImplementation(async () => notes);
  jest.spyOn(utils, 'syncChangesWithServer').mockImplementation(async () => emptySyncChangesResponse);
}

jest.mock('../../../hooks/use-auth.tsx', () => ({
  useAuth: () => {
    return {
      loading: true,
      user: { name: "TestUser", token: "fakeAuthToken" },
      signin: jest.fn(),
      signout: jest.fn(),
      signup: jest.fn()
    }
  }
}));

test("Shows loading state for login when needed", async () => {
  mockApiCalls(someNotes);
  const { findByText } = render(<Home />);
  await findByText("Loggin you in...");
});