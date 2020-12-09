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

const generateTransactions = (key: string, changes: JSON): string[] => {
  let transactions = [];
  if (key[0] === "_") {
    // it's either a delete or move
    let indexFromLhs = key.slice(1);
    if (Array.isArray(changes)) {
      if (changes.length === 2) {
        transactions.push("it's a move within the same parent");
      } else if (changes.length === 3) {
        transactions.push("it's a delete");
      }
    }
  } else {
    // it's either an update for existing note or it's an addition of a note
    if (Array.isArray(changes)) {
      transactions.push("it's a new note added");
    } else {
      // update the content/collapsed
      if ("child_notes" in changes) {
        transactions.push(...createTransactionsFromChanges(changes["child_notes"]));
      }
      if ("content" in changes || "collapsed" in changes) {
        transactions.push("it's just content/collapsed updation");
      }
    }
  }
  return transactions;
}

export const syncChangesWithServer = async (debouncedNotes: NotesType[], syncedNotes: NotesType[]) => {
  console.log("calling the api");
  let changes = jsonDiff.diff(syncedNotes, debouncedNotes);

  if (!changes) return false;

  console.log(createTransactionsFromChanges(changes));
  return true;
}

function createTransactionsFromChanges(changes: any) {
  let transactions: string[] = [];
  if (changes["_t"] && changes["_t"] === "a") {
    changes && Object.keys(changes).forEach(key => {
      if (key !== "_t") {
        transactions.push(...generateTransactions(key, changes[key]));
      }
    });
  }
  return transactions;
}
