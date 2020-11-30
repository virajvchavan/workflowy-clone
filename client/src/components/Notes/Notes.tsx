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
      marginLeft: '10%',
      width: '75%',
      border: 'none',
      padding: '5px',
      resize: 'none',
      '&focus': {
        border: 'none'
      }
    }
  }),
);

interface NotesType {
  _id: IdOrUserId;
  content: string;
  order: number;
  path: string;
  user_id: IdOrUserId;
}
interface IdOrUserId {
  $oid: string;
}

export default function Notes() {
  const classes = useStyles();
  const auth = useAuth();
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
    .then(json => setNotes(json))
    .catch(error => console.log(error));
  }, [auth]);

  return <Paper elevation={2} className={classes.paper}>
    {notes.map((note, index) => {
      return <ContentEditable
        key={index}
        className={classes.editable}
        tagName="pre"
        html={note.content} // innerHTML of the editable div
        disabled={false} // use true to disable edition
        onChange={(evt) => console.log(evt.target.value)} // handle innerHTML change
        onBlur={(evt) => console.log("blurred")}
      />
    })}
  </Paper>
}
