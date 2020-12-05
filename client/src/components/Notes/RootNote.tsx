import React, { useEffect, useState } from "react";
import { makeStyles, Theme, createStyles, Paper } from "@material-ui/core";
import Notes, { NotesType } from "./Notes";
import { useAuth } from '../../hooks/use-auth';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    notesRoot: {
      marginLeft: "40px",
      paddingTop: "10px",
      paddingBottom: "10px"
    },
    paper: {
      width: "100%"
    },
  }),
);

export default function RootNotes() {
  const classes = useStyles();
  const auth = useAuth();
  const [syncedNotes, setSyncedNotes] = useState<Array<NotesType>>([]);
  const [notes, setNotes] = useState<Array<NotesType>>([]);

  useEffect(() => {
    window.fetch('/api/notes', {
      method: 'GET',
      credentials: 'include',
      headers: {
          'Authorization': "Bearer " + auth?.user?.token,
          'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(json => {
      setNotes(json);
      setSyncedNotes(json);
    })
    .catch(error => console.log(error));
  }, [auth]);

  const onNoteContentChange = (deepIndex: string, newContent: string) => {
    let newNotes = [...notes];
    let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
    let noteToUpdate = newNotes[indices[0]];
    indices.shift();
    indices.forEach(index => {
      noteToUpdate = noteToUpdate.child_notes[index];
    });
    noteToUpdate.content = newContent;
    setNotes(newNotes);
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

  const addAChildNote = (deepIndex: string) => {
    let newNotes = [...notes];
    let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
    let emptyNote = {content: "", id: "", child_notes: []};
    let noteIndexToFocusOn = "";

    let childrenOfCurrentNote = getNoteForIndices(newNotes, indices).child_notes;
    if (childrenOfCurrentNote.length > 0) {
      childrenOfCurrentNote.unshift(emptyNote);
      noteIndexToFocusOn = deepIndex + ".0";
    } else {
      if (indices.length > 1) {
        let newNoteIndex: number = indices.pop() || 0;
        newNoteIndex += 1;
        let noteToUpdate = getNoteForIndices(newNotes, indices);
        noteToUpdate.child_notes.splice(newNoteIndex || 0, 0, emptyNote);
        noteIndexToFocusOn = `.${indices.join(".")}.${newNoteIndex}`;
      } else {
        newNotes.splice(indices[0] + 1, 0, emptyNote);
        noteIndexToFocusOn = `.${indices[0] + 1}`;
      }
    }

    setNotes(newNotes);
    focusOnANote(noteIndexToFocusOn);
  }

  const handleTabPress = (deepIndex: string) => {
    let newNotes = [...notes];
    let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
    let originalIndex = indices.pop() || 0;
    let newLeafIndex: number;
    if (originalIndex > 0) {
      if (indices.length === 0) {
        let noteToMove = newNotes.splice(originalIndex, 1)[0];
        newNotes[originalIndex - 1].child_notes.push(noteToMove);
        newLeafIndex = newNotes[originalIndex - 1].child_notes.length - 1;
      } else {
        let originalParent = getNoteForIndices(newNotes, indices);
        let noteToMove = originalParent.child_notes.splice(originalIndex, 1)[0];
        originalParent.child_notes[originalIndex - 1].child_notes.push(noteToMove);
        newLeafIndex = originalParent.child_notes[originalIndex - 1].child_notes.length - 1;
      }
      setNotes(newNotes);
      focusOnANote(`.${indices.join(".")}.${originalIndex - 1}.${newLeafIndex}`);
    }
  }

  const handleBackspaceWhenEmpty = (deepIndex: string) => {
    let newNotes = [...notes];
    let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
    let originalIndex = indices.pop() || 0;
    let parentNote = getNoteForIndices(newNotes, indices);
    let currentNote = parentNote.child_notes[originalIndex];
    if (currentNote.child_notes.length > 0) {
      // add its children to its parent
      parentNote.child_notes.push(...currentNote.child_notes);
    }
    parentNote.child_notes.splice(originalIndex, 1);
    setNotes(newNotes);
  
    let indexToFocusOn = `.${indices.join(".")}`;
    if (originalIndex > 0) {
      indexToFocusOn += `.${originalIndex - 1}`;
    }
    focusOnANote(indexToFocusOn);
  }

  // directly accessing dom here to avoid passing refs in an infinitely nested list
  // passing refs too deep might be a performance issue as well
  const focusOnANote = (deepIndex: string) => {
    setTimeout(() => {
      document.getElementById("note" + deepIndex)?.focus();
    }, 0);
  }

  return <Paper elevation={2} className={classes.paper}>
    <div className={classes.notesRoot}>
      <Notes notes={notes} index=""
        onNoteContentChange={onNoteContentChange}
        addAChildNote={addAChildNote}
        handleTabPress={handleTabPress}
        handleBackspaceWhenEmpty={handleBackspaceWhenEmpty}
      />
    </div>
  </Paper>
}
