import React, { useEffect, useState } from "react";
import { makeStyles, Theme, createStyles, Paper } from "@material-ui/core";
import Notes, { NotesType } from "./Notes";
import { useAuth } from '../../hooks/use-auth';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    notesRoot: {
      marginLeft: "40px",
      paddingTop: "10px"
    },
    paper: {
      width: "100%",
      height: theme.spacing(30)
    },
  }),
);

export default function RootNotes() {
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
    <div className={classes.notesRoot}><Notes notes={notes} /></div>
  </Paper>
}
