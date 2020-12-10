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

interface Transaction {
  type: "add" | "delete" | "move_same_parent" | "update",
  id?: string,
  new_index?: number,
  parent_id?: string,
  fields?: NoteFields
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

const generateTransactions = (key: string, changes: JSON, indexes: Array<number>, newNotes: NotesType[]): Transaction[] => {
  let transactions: Transaction[] = [];
  if (key[0] === "_") {
    // it's either a delete or move
    let indexFromLhs = key.slice(1);
    if (Array.isArray(changes)) {
      if (changes.length === 2) {
        let noteId = getNoteForIndices(newNotes, indexes).child_notes[changes[1]].id;
        transactions.push({ type: "move_same_parent", id: noteId, new_index: changes[1] });
      } else if (changes.length === 3) {
        transactions.push({ type: "delete", id: changes[0].id });
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
      transactions.push({type: "add", parent_id: parent_id, id: changes[0].id, new_index: parseInt(key), fields: changes[0]});
    } else {
      // update the content/collapsed
      if ("child_notes" in changes) {
        transactions.push(...createTransactionsFromChanges(changes["child_notes"], [...indexes, parseInt(key)], newNotes));
      }

      let fields: NoteFields = {};
      if ("content" in changes) {
        fields.content = changes["content"][1] ? changes["content"][1] : changes["content"][0];
      }
      if ("collapsed" in changes) {
        fields.collapsed = changes["collapsed"][1] ? changes["collapsed"][1] : changes["collapsed"][0];
      }
      if (Object.keys(fields).length > 0) {
        transactions.push({type: "update", id: "asdad", fields: fields});
      }
    }
  }
  return transactions;
}

export const syncChangesWithServer = async (newNotes: NotesType[], syncedNotes: NotesType[]) => {
  console.log("calling the api");
  let changes = jsonDiff.diff(syncedNotes, newNotes);

  if (!changes) return false;

  console.log(createTransactionsFromChanges(changes, [], newNotes));
  return true;
}

function createTransactionsFromChanges(changes: any, indexes: Array<number>, newNotes: NotesType[]) {
  let transactions: Transaction[] = [];
  if (changes["_t"] && changes["_t"] === "a") {
    changes && Object.keys(changes).forEach(key => {
      if (key !== "_t") {
        transactions.push(...generateTransactions(key, changes[key], indexes, newNotes));
      }
    });
  }
  return transactions;
}
