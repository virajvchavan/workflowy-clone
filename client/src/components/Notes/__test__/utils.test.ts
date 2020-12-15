import * as utils from '../utils';
import serverApis from '../serverApis';
import { NotesType } from '../Notes';
import { waitFor } from '@testing-library/react';

function mockApiCalls(notes: NotesType[]) {
  const fetchAllNotes = jest.spyOn(serverApis, 'fetchAllNotes').mockImplementation(async () => notes);
  const callProcessTransactionsApi = jest.spyOn(serverApis, 'callProcessTransactionsApi').mockImplementation(async () => new Response("[]", {status: 200, headers: {responseType: "application/json"}}));
  return {fetchAllNotes, callProcessTransactionsApi};
}

describe("Generating correct transactions for changes made by the user", () => {
  test("it should not call the callProcessTransactionsApi function after syncChangesWithServer is called with no new updates", async () => {
    const {callProcessTransactionsApi} = mockApiCalls([]);
    utils.syncChangesWithServer([{id: "1", content: "one", collapsed: false, child_notes: []}], [{id: "1", content: "one", collapsed: false, child_notes: []}], "");
    await waitFor(() => expect(callProcessTransactionsApi).not.toHaveBeenCalled());
  });

  test("it should call the callProcessTransactionsApi function after syncChangesWithServer is called with some new updates", async () => {
    const {callProcessTransactionsApi} = mockApiCalls([]);
    utils.syncChangesWithServer([{id: "1", content: "one", collapsed: false, child_notes: []}], [], "");
    await waitFor(() => expect(callProcessTransactionsApi).toHaveBeenCalled());
  });

  test("it should generate correct 'added' transactions", async () => {
    let syncedNotes = [
      {id: "1", content: "one", collapsed: false, child_notes: []}
    ];
    let currentNotes = [
      {id: "1", content: "one", collapsed: false, child_notes: []},
      {id: "2", content: "two", collapsed: false, child_notes: []}
    ];
    const {callProcessTransactionsApi} = mockApiCalls([]);
    utils.syncChangesWithServer(currentNotes, syncedNotes, "fakeAuthToken");
    await waitFor(() => expect(callProcessTransactionsApi).toHaveBeenCalledWith("fakeAuthToken", {
      added: [{
        id: "2",
        index: 1,
        parent_id: "root",
        fields: { content: "two", collapsed: false, id: "2", child_notes: [] },
        indexPath: [1]
      }],
      deleted: [],
      updated: [],
      move_same_parent: []
    }));
  });

  test("it should generate correct 'deleted' transactions", async () => {
    let syncedNotes = [
      {id: "1", content: "one", collapsed: false, child_notes: []},
      {id: "2", content: "two", collapsed: false, child_notes: []}
    ];
    let currentNotes = [
      {id: "1", content: "one", collapsed: false, child_notes: []}
    ];
    const {callProcessTransactionsApi} = mockApiCalls([]);
    utils.syncChangesWithServer(currentNotes, syncedNotes, "fakeAuthToken");
    await waitFor(() => expect(callProcessTransactionsApi).toHaveBeenCalledWith("fakeAuthToken", {
      added: [],
      deleted: [{
        id: "2"
      }],
      updated: [],
      move_same_parent: []
    }));
  });

  test("it should generate correct 'updated' transactions", async () => {
    let syncedNotes = [
      {id: "1", content: "one", collapsed: false, child_notes: []},
      {id: "2", content: "two", collapsed: false, child_notes: []}
    ];
    let currentNotes = [
      {id: "1", content: "once", collapsed: false, child_notes: []},
      {id: "2", content: "twice", collapsed: false, child_notes: []}
    ];
    const {callProcessTransactionsApi} = mockApiCalls([]);
    utils.syncChangesWithServer(currentNotes, syncedNotes, "fakeAuthToken");
    await waitFor(() => expect(callProcessTransactionsApi).toHaveBeenCalledWith("fakeAuthToken", {
      added: [],
      deleted: [],
      updated: [
        { id: "1", fields: { content: "once" } },
        { id: "2", fields: { content: "twice" } }
      ],
      move_same_parent: []
    }));
  });

  test("it should generate correct add' transactions when a note is moved, and not a delete transaction", async () => {
    let syncedNotes = [
      {id: "1", content: "one", collapsed: false, child_notes: [
        {id: "2", content: "two", collapsed: false, child_notes: []}
      ]},
    ];
    let currentNotes = [
      {id: "1", content: "one", collapsed: false, child_notes: []},
      {id: "2", content: "two", collapsed: false, child_notes: []}
    ];
    const {callProcessTransactionsApi} = mockApiCalls([]);
    utils.syncChangesWithServer(currentNotes, syncedNotes, "fakeAuthToken");
    await waitFor(() => expect(callProcessTransactionsApi).toHaveBeenCalledWith("fakeAuthToken", {
      added: [{
        id: "2",
        index: 1,
        parent_id: "root",
        fields: { content: "two", collapsed: false, id: "2", child_notes: [] },
        indexPath: [1]
      }],
      deleted: [],
      updated: [],
      move_same_parent: []
    }));
  });
});
