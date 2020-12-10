import { NotesType } from './Notes';

let jsonDiff = require('jsondiffpatch').create({
  objectHash: (obj: NotesType) => obj.id,
  textDiff: {
    minLength: 1000000
  }
});

interface SyncedDataResponse {
  indexPath: string[],
  newId: string
}

type NoteFields = {
  content? : string,
  collapsed?: string
}

interface Transactions {
  add: Array<{
    id?: string,
    index?: number,
    parent_id: string,
    fields?: NoteFields
  }>,
  delete:  Array<{
    id?: string
  }>,
  update: Array<{
    id?: string,
    fields?: NoteFields
  }>,
  move_same_parent: Array<{
    id?: string,
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
    add: [], delete: [], update: [], move_same_parent: []
  };
  if (key[0] === "_") {
    // it's either a delete or move
    let indexFromLhs = key.slice(1);
    if (Array.isArray(changes)) {
      if (changes.length === 2) {
        let noteId = getNoteForIndices(newNotes, indexes).child_notes[changes[1]].id;
        transactions.move_same_parent.push({ id: noteId, new_index: changes[1] });
      } else if (changes.length === 3) {
        transactions.delete.push({ id: changes[0].id });
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
      transactions.add.push({parent_id: parent_id, id: changes[0].id, index: parseInt(key), fields: changes[0]});
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
        fields.collapsed = changes["collapsed"][1] ? changes["collapsed"][1] : changes["collapsed"][0];
      }
      if (Object.keys(fields).length > 0) {
        transactions.update.push({id: getNoteForIndices(newNotes, indices_for_note).id, fields: fields});
      }
    }
  }
  return transactions;
}

const correctDeletedTransactions = (transactions: Transactions) => {
  // some notes may be moved from one parent to another, but they'll show up as deleted + added
  // we need to remove note_ids from transactions with type 'delete' that are not really deleted, but moved
  return transactions;
}

export const syncChangesWithServer = async (newNotes: NotesType[], syncedNotes: NotesType[]) => {
  console.log("calling the api");
  let changes = jsonDiff.diff(syncedNotes, newNotes);

  if (!changes) return false;

  let transactions = createTransactionsFromChanges(changes, [], newNotes);
  console.log(correctDeletedTransactions(transactions));
  return true;
}

const createTransactionsFromChanges = (changes: any, indexes: Array<number>, newNotes: NotesType[]) => {
  let transactions: Transactions = {
    add: [], delete: [], update: [], move_same_parent: []
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
    add: [...t1.add, ...t2.add],
    delete: [...t1.delete, ...t2.delete],
    update: [...t1.update, ...t2.update],
    move_same_parent: [...t1.move_same_parent, ...t2.move_same_parent]
  }
}
