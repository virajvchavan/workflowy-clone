import { createStyles, makeStyles, Paper, Theme } from "@material-ui/core";
import React from "react";
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import ContentEditable from "react-contenteditable";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      width: "100%",
      height: theme.spacing(30)
    },
    editable: {
      fontFamily: 'sans-serif',
      display: "list-item",
      width: '75%',
      border: 'none',
      padding: '5px',
      resize: 'none',
      margin: 0,
      '&focus': {
        border: 'none'
      }
    },
    child_notes: {
      marginLeft: "20px"
    }
  }),
);

interface NotesType {
  id: string;
  content: string;
  child_notes: Array<NotesType>
}

interface Props {
  notesIn?: Array<NotesType>
  className?: string
}

export default function Notes(props: Props) {
  const classes = useStyles();
  const auth = useAuth();
  const [notes, setNotes] = useState<Array<NotesType>>([]);

  useEffect(() => {
    if (!props.notesIn) {
      window.fetch('/api/notes', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Authorization': "Bearer " + auth?.user?.token,
            'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(json => setNotes(json))
      .catch(error => console.log(error));
    } else {
      setNotes(props.notesIn);
    }
  }, [auth, props.notesIn]);

  return <>
    {notes.map((note, index) => {
      return <div className={props.className}>
        <ContentEditable
        key={index}
        className={classes.editable}
        tagName="pre"
        html={note.content} // innerHTML of the editable div
        disabled={false} // use true to disable edition
        onChange={(evt) => console.log(evt.target.value)} // handle innerHTML change
        onBlur={(evt) => console.log("blurred")}
      />
      {note.child_notes ? <Notes className={classes.child_notes} notesIn={note.child_notes} /> : null}
      </div>
    })}
  </>
}
