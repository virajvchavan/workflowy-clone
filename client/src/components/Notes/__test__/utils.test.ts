import * as utils from '../utils';
import serverApis from '../serverApis';
import { NotesType } from '../Notes';
import { waitFor } from '@testing-library/react';

function mockApiCalls(notes: NotesType[]) {
  const fetchAllNotes = jest.spyOn(serverApis, 'fetchAllNotes').mockImplementation(async () => notes);
  const callProcessTransactionsApi = jest.spyOn(serverApis, 'callProcessTransactionsApi').mockImplementation(async () => new Response("[]", {status: 200, headers: {responseType: "application/json"}}));
  return [fetchAllNotes, callProcessTransactionsApi];
}

describe("Generating correct transactions for changes made by the user", () => {
  test("it should not call the callProcessTransactionsApi function after syncChangesWithServer is called with no new updates", async () => {
    const [fetchAllNotes, callProcessTransactionsApi] = mockApiCalls([]);
    utils.syncChangesWithServer([{id: "1", content: "one", collapsed: false, child_notes: []}], [{id: "1", content: "one", collapsed: false, child_notes: []}], "");
    await waitFor(() => expect(callProcessTransactionsApi).not.toHaveBeenCalled());
  });

  test("it should call the callProcessTransactionsApi function after syncChangesWithServer is called with some new updates", async () => {
    const [fetchAllNotes, callProcessTransactionsApi] = mockApiCalls([]);
    utils.syncChangesWithServer([{id: "1", content: "one", collapsed: false, child_notes: []}], [], "");
    await waitFor(() => expect(callProcessTransactionsApi).toHaveBeenCalled());
  });

  test("it should generate correct 'added' transactions", () => {

  });

  test("it should generate correct 'deleted' transactions", () => {

  });

  test("it should generate correct 'updated' transactions", () => {

  });
});
