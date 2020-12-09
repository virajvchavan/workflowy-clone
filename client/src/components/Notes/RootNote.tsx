import React, { useEffect, useState } from "react";
import { makeStyles, Theme, createStyles, Paper } from "@material-ui/core";
import Notes, { NotesType } from "./Notes";
import { useAuth } from '../../hooks/use-auth';
import produce from 'immer';
import { useDebounce } from 'use-debounce';

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
    addBtn: {
      marginLeft: "20px",
      cursor: "pointer",
      color: 'grey',
      marginTop: "5px"
    }
  }),
);

export default function RootNotes() {
  const classes = useStyles();
  const auth = useAuth();
  const [notes, setNotes] = useState<Array<NotesType>>([]);
  const [syncedNotes, setSyncedNotes] = useState<Array<NotesType>>([]);

  // if the user doesn't type anything for 5 seconds straight, make API calls to the server
  const [debouncedNotes] = useDebounce(notes, 5000);

  useEffect(() => {
    if (syncedNotes.length > 0 && debouncedNotes.length > 0) {
      // console.log(syncedNotes);
      // console.log(debouncedNotes);
      console.log("calling the api");
    }
  }, [debouncedNotes, syncedNotes])

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

  const updateNoteField = (deepIndex: string, field: 'content' | 'collapsed', valueToSet: any) => {
    setNotes(produce(newNotes => {
      let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
      let noteToUpdate = newNotes[indices[0]];
      indices.shift();
      indices.forEach(index => {
        noteToUpdate = noteToUpdate.child_notes[index];
      });
      if (field === "content") {
        noteToUpdate.content = valueToSet;
      } else if (field === "collapsed") {
        noteToUpdate.collapsed = valueToSet;
      }
    }));
  }

  const onNoteContentChange = (deepIndex: string, newContent: string) => {
    updateNoteField(deepIndex, "content", newContent);
  }

  const setCollapsedForNote = (deepIndex: string, state: boolean) => {
    updateNoteField(deepIndex, "collapsed", state);
    focusOnANote(deepIndex);
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
    setNotes(produce(newNotes => {
      let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
      let emptyNote = {content: "", id: "", child_notes: []};
      let noteIndexToFocusOn = "";

      let currentNote = getNoteForIndices(newNotes, indices);
      let childrenOfCurrentNote = currentNote.child_notes;
      if (childrenOfCurrentNote.length > 0 && !currentNote.collapsed) {
        childrenOfCurrentNote.unshift(emptyNote);
        noteIndexToFocusOn = deepIndex + ".0";
      } else {
        if (indices.length > 1) {
          let newNoteIndex: number = indices.pop() || 0;
          newNoteIndex += 1;
          let noteToUpdate = getNoteForIndices(newNotes, indices);
          noteToUpdate.child_notes.splice(newNoteIndex || 0, 0, emptyNote);
          noteToUpdate.collapsed = false;
          noteIndexToFocusOn = `.${indices.join(".")}.${newNoteIndex}`;
        } else {
          newNotes.splice(indices[0] + 1, 0, emptyNote);
          noteIndexToFocusOn = `.${indices[0] + 1}`;
        }
      }
      focusOnANote(noteIndexToFocusOn);
    }));
  }

  const handleTabPress = (deepIndex: string) => {
    setNotes(produce(newNotes => {
      let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
      let originalIndex = indices.pop() || 0;
      let newLeafIndex: number;
      if (originalIndex > 0) {
        if (indices.length === 0) {
          let noteToMove = newNotes.splice(originalIndex, 1)[0];
          newNotes[originalIndex - 1].child_notes.push(noteToMove);
          newNotes[originalIndex - 1].collapsed = false;
          newLeafIndex = newNotes[originalIndex - 1].child_notes.length - 1;
        } else {
          let originalParent = getNoteForIndices(newNotes, indices);
          let noteToMove = originalParent.child_notes.splice(originalIndex, 1)[0];
          originalParent.child_notes[originalIndex - 1].child_notes.push(noteToMove);
          originalParent.child_notes[originalIndex - 1].collapsed = false;
          newLeafIndex = originalParent.child_notes[originalIndex - 1].child_notes.length - 1;
        }
        let indexToFocuson = indices.length > 0 ? `.${indices.join(".")}` : "";
        indexToFocuson += `.${originalIndex - 1}.${newLeafIndex}`;
        focusOnANote(indexToFocuson);
      }
    }));
  }

  const handleShiftTabPress = (deepIndex: string) => {
    setNotes(produce(newNotes => {
      let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));

      if (indices.length === 1) return;

      let originalIndex = indices.pop() || 0;
      let parentIndex = indices.pop() || 0;
      if (indices.length === 0) {
        newNotes.splice(parentIndex + 1, 0, newNotes[parentIndex].child_notes.splice(originalIndex, 1)[0]);
      } else {
        let grandParentNote = getNoteForIndices(newNotes, indices);
        grandParentNote.child_notes.splice(
          parentIndex + 1,
          0,
          grandParentNote.child_notes[parentIndex].child_notes.splice(originalIndex, 1)[0]
        )
      }
      let indexToFocusOn = indices.length > 0 ? `.${indices.join(".")}` : "";
      indexToFocusOn += `.${parentIndex + 1}`;
      focusOnANote(indexToFocusOn);
    }));
  }

  const handleBackspaceWhenEmpty = (deepIndex: string) => {
    setNotes(produce((newNotes: NotesType[]) => {
      let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
      let originalIndex = indices.pop() || 0;
      if (indices.length === 0) {
        let currentNote = newNotes[originalIndex];
        if (!currentNote.content) {
          if (currentNote.child_notes.length > 0) {
            newNotes.push(...currentNote.child_notes);
          }
          newNotes.splice(originalIndex, 1);
          focusOnANote(`.${originalIndex - 1}`);
        }
      } else {
        let parentNote = getNoteForIndices(newNotes, indices);
        let currentNote = parentNote.child_notes[originalIndex];
        if (!currentNote.content) {
          if (currentNote.child_notes.length > 0) {
            // add its children to its parent
            parentNote.child_notes.push(...currentNote.child_notes);
          }
          parentNote.child_notes.splice(originalIndex, 1);

          let indexToFocusOn = `.${indices.join(".")}`;
          if (originalIndex > 0) {
            indexToFocusOn += `.${originalIndex - 1}`;
          }
          focusOnANote(indexToFocusOn);
        }
      }
    }));
  }

  const handleUpKey = (deepIndex: string) => {
    setNotes(produce(newNotes => {
      let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
      if (indices[indices.length - 1] > 0) {
        // if has any siblings
        indices[indices.length - 1] = indices[indices.length - 1] -1;
        let noteToFocus = getNoteForIndices(newNotes, indices);
        while (noteToFocus.child_notes.length > 0 && !noteToFocus.collapsed) {
          indices.push(noteToFocus.child_notes.length - 1);
          noteToFocus = noteToFocus.child_notes[noteToFocus.child_notes.length - 1]
        }
      } else {
        indices.pop();
      }
      focusOnANote(`.${indices.join(".")}`);
    }));
  }

  const handleDownKey = (deepIndex: string) => {
    setNotes(produce(newNotes => {
      let indices = deepIndex.slice(1).split(".").map(i => parseInt(i));
      let originalIndex = indices.pop() || 0;
      if (indices.length === 0) {
        let currentNote = newNotes[originalIndex];
        if (currentNote.child_notes.length > 0 && !currentNote.collapsed) {
          indices.push(originalIndex);
          indices.push(0);
        } else {
          indices.push(originalIndex + 1);
        }
      } else {
        let parentNote = getNoteForIndices(newNotes, indices);
        let currentNote = parentNote.child_notes[originalIndex];
        if (currentNote.child_notes.length > 0 && !currentNote.collapsed) {
          indices.push(originalIndex);
          indices.push(0);
        } else {
          indices.push(originalIndex);
            while (true) {
              indices[indices.length - 1] = indices[indices.length - 1] + 1;
              if (indices.length === 1) {
                break;
              }
              // doing it this way because accessing parent notes of a note would be expensive
              if (document.getElementById(`note.${indices.join(".")}`)) {
                break;
              } else {
                indices.pop();
              }
            }
        }
      }
      focusOnANote(`.${indices.join(".")}`);
    }))
  }

  const onAddBtnClick = () => {
    setNotes(produce(newNotes => {
      newNotes.push({content: "", id: "", child_notes: []});
      focusOnANote(`.${newNotes.length - 1}`);
    }));
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
        handleUpKey={handleUpKey}
        handleDownKey={handleDownKey}
        setCollapsedForNote={setCollapsedForNote}
        handleShiftTabPress={handleShiftTabPress}
      />
      <div className={classes.addBtn} onClick={onAddBtnClick}>+</div>
    </div>
  </Paper>
}
