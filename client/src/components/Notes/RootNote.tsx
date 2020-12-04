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

  const addAChildNote = (deepIndex: string) => {
    let newNotes = [...notes];
    let emptyNote = {content: "", id: "", child_notes: []};
    let noteIndexToFocusOn = "";
    if (deepIndex) {
      let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
      let noteToUpdate = newNotes[indices[0]];
      indices.shift();
      indices.forEach(index => {
        noteToUpdate = noteToUpdate.child_notes[index];
      });
      noteToUpdate.child_notes.push(emptyNote);
      noteIndexToFocusOn = `${deepIndex}.${noteToUpdate.child_notes.length - 1}`;
    } else {
      newNotes.push(emptyNote);
      noteIndexToFocusOn = `.${newNotes.length - 1}`;
    }
    setNotes(newNotes);
    focusOnANote(noteIndexToFocusOn);
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
      <Notes notes={notes} index="" onNoteContentChange={onNoteContentChange} addAChildNote={addAChildNote} />
    </div>
  </Paper>
}
