import { createStyles, makeStyles, Theme } from "@material-ui/core";
import React from "react";
import ContentEditable from "react-contenteditable";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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

export interface NotesType {
  id: string;
  content: string;
  child_notes: Array<NotesType>
}

interface Props {
  notes: Array<NotesType>
  className?: string
}

export default function Notes(props: Props) {
  const classes = useStyles();

  return <>
    {props.notes.map((note, index) => {
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
      {note.child_notes ? <Notes className={classes.child_notes} notes={note.child_notes} /> : null}
      </div>
    })}
  </>
}
