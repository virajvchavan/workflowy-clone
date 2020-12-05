import { createStyles, makeStyles, Theme } from "@material-ui/core";
import React from "react";
import ContentEditable from "react-contenteditable";
import sanitizeHtml from "sanitize-html";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    editable: {
      fontFamily: 'sans-serif',
      display: "list-item",
      whiteSpace: 'pre-wrap',
      wordBreak: 'keep-all',
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
  child_notes: Array<NotesType>,
}

interface Props {
  notes: Array<NotesType>
  className?: string,
  index: string,
  onNoteContentChange: (deepIndex: string, newContent: string) => void,
  addAChildNote: (deepIndex: string) => void,
  handleTabPress: (deepIndex: string) => void,
  handleBackspaceWhenEmpty: (deepIndex: string) => void
}

const sanitizeConf = {
  allowedTags: ["b", "i", "em", "strong", "a", "p", "h1"],
  allowedAttributes: { a: ["href"] }
};

export default function Notes(props: Props) {
  const classes = useStyles();

  return <>
    {props.notes.map((note, index) => {
      let deepIndex = `${props.index}.${index}`;

      const onKeyDown = (evt: React.KeyboardEvent<HTMLDivElement>) => {
        if (evt.key === "Enter" && !evt.shiftKey) {
          evt.preventDefault();
          props.addAChildNote(deepIndex);
        } else if (evt.key === "Tab") {
          evt.preventDefault();
          evt.stopPropagation();
          props.handleTabPress(deepIndex);
        } else if (evt.key === "Backspace") {
          if (!note.content) {
            evt.preventDefault();
            props.handleBackspaceWhenEmpty(deepIndex);
          }
        }
      }

      return <div className={props.className}>
        <ContentEditable
          key={deepIndex}
          id={'note' + deepIndex}
          className={classes.editable}
          tagName="pre"
          html={note.content} // innerHTML of the editable div
          disabled={false} // use true to disable edition
          onChange={(evt) => props.onNoteContentChange(deepIndex, sanitizeHtml(evt.target.value, sanitizeConf))} // handle innerHTML change
          onBlur={(evt) => console.log("blurred")}
          onKeyDown={onKeyDown}
        />

        {note.child_notes ?
          <Notes
            index={deepIndex}
            className={classes.child_notes}
            notes={note.child_notes}
            onNoteContentChange={props.onNoteContentChange}
            addAChildNote={props.addAChildNote}
            handleTabPress={props.handleTabPress}
            handleBackspaceWhenEmpty={props.handleBackspaceWhenEmpty}
          />
          : null
        }
      </div>
    })}
  </>
}
