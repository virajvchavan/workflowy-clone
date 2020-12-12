import { NotesType } from './Notes';

let jsonDiff = require('jsondiffpatch').create({
  objectHash: (obj: NotesType) => obj.id,
  textDiff: {
    minLength: 1000000
  }
});

type NoteFields = {
  id?: string,
  content? : string,
  collapsed?: boolean,
  child_notes?: AddedTransaction[]
}

type AddedTransaction = {
  id: string,
  index: number,
  parent_id: string,
  fields?: NoteFields,
  indexPath: number[]
}

interface Transactions {
  added: Array<AddedTransaction>,
  deleted:  Array<{
    id: string
  }>,
  updated: Array<{
    id: string,
    fields?: NoteFields
  }>,
  move_same_parent: Array<{
    id: string,
    new_index?: number
  }>
}

  // indices are the sequence in which to access a note in the state
  const getNoteForIndices = (newNotes: NotesType[], indices: number[]) => {
    let noteToUpdate = newNotes[indices[0]];
    indices.forEach((index, i) => {
      if (i !== 0) {
        noteToUpdate = noteToUpdate.child_notes[index];
      }
    });
    return noteToUpdate;
  }

const generateTransactions = (key: string, changes: JSON, indexes: Array<number>, newNotes: NotesType[]): Transactions => {
  let transactions: Transactions = {
    added: [], deleted: [], updated: [], move_same_parent: []
  };
  if (key[0] === "_") {
    // it's either a delete or move
    let indexFromLhs = key.slice(1);
    if (Array.isArray(changes)) {
      if (changes.length === 2) {
        let noteId = getNoteForIndices(newNotes, indexes).child_notes[changes[1]].id;
        transactions.move_same_parent.push({ id: noteId, new_index: changes[1] });
      } else if (changes.length === 3) {
        transactions.deleted.push({ id: changes[0].id });
      }
    }
  } else {
    // it's either an update for existing note or it's an addition of a note
    if (Array.isArray(changes)) {
      let parent_id: string = "root";
      if (indexes.length > 0) {
        console.log("getting parent from: " + indexes);
        parent_id = getNoteForIndices(newNotes, indexes).id;
      }
      transactions.added.push({
        parent_id: parent_id,
        id: changes[0].id,
        index: parseInt(key),
        fields: changes[0],
        indexPath: [...indexes, parseInt(key)]
      });
    } else {
      // update the content/collapsed
      let indices_for_note = [...indexes, parseInt(key)];
      if ("child_notes" in changes) {
        transactions = mergeTransactionObjects(transactions, createTransactionsFromChanges(changes["child_notes"], indices_for_note, newNotes));
      }

      let fields: NoteFields = {};
      if ("content" in changes) {
        fields.content = changes["content"][1] ? changes["content"][1] : changes["content"][0];
      }
      if ("collapsed" in changes) {
        fields.collapsed = typeof changes["collapsed"][1] === 'undefined' ? changes["collapsed"][0] : changes["collapsed"][1];
      }
      if (Object.keys(fields).length > 0) {
        transactions.updated.push({id: getNoteForIndices(newNotes, indices_for_note).id, fields: fields});
      }
    }
  }
  return transactions;
}

const correctDeletedTransactions = (transactions: Transactions) => {
  // some notes may be moved from one parent to another, but they'll show up as deleted + added
  // we need to remove note_ids from transactions with type 'delete' that are not really deleted, but moved
  // let deleteIds = transactions.deleted.map(transaction => transaction.id);
  let idsToNotDelete: string[] = [];
  transactions.added.forEach(transaction => {
    idsToNotDelete.push(...getAllAddedNoteIds(transaction));
  });

  transactions.deleted = transactions.deleted.filter(transaction => {
    return !idsToNotDelete.includes(transaction.id)
  });

  return transactions;
}

const getAllAddedNoteIds = (addedTransaction: AddedTransaction): string[] => {
  let result: string[] = [];
  result.push(addedTransaction.id);
  if (addedTransaction.fields?.child_notes?.length) {
    addedTransaction.fields.child_notes.forEach(transaction => {
      result.push(...getAllAddedNoteIds(transaction));
    });
  }
  return result;
}

interface newNoteIds {
  indexPath: number[],
  newId: string
}

interface SyncedDataResponse {
  status: "success" | "error",
  newNoteIds?: newNoteIds[]
}

export const syncChangesWithServer = async (newNotes: NotesType[], syncedNotes: NotesType[], authToken: string): Promise<SyncedDataResponse> => {
  console.log("calling the api");
  let changes = jsonDiff.diff(syncedNotes, newNotes);

  if (!changes) return { status: "error" };

  let transactions = createTransactionsFromChanges(changes, [], newNotes);

  let response = await fetch("/api/notes/process_transactions", {
    method: "POST", credentials: 'include',
    headers: {
      'Authorization': "Bearer " + authToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transactions)
  });

  if (response.status === 200) {
    return { status: "success", newNoteIds: [] };
  } else {
    return { status: "error" };
  }
}

const createTransactionsFromChanges = (changes: any, indexes: Array<number>, newNotes: NotesType[]) => {
  let transactions: Transactions = {
    added: [], deleted: [], updated: [], move_same_parent: []
  };
  if (changes["_t"] && changes["_t"] === "a") {
    changes && Object.keys(changes).forEach(key => {
      if (key !== "_t") {
        transactions = mergeTransactionObjects(transactions, generateTransactions(key, changes[key], indexes, newNotes));
      }
    });
  }
  return transactions;
}

const mergeTransactionObjects = (t1: Transactions, t2: Transactions): Transactions => {
  return {
    added: [...t1.added, ...t2.added],
    deleted: [...t1.deleted, ...t2.deleted],
    updated: [...t1.updated, ...t2.updated],
    move_same_parent: [...t1.move_same_parent, ...t2.move_same_parent]
  }
}
