import { createStyles, makeStyles, Theme } from "@material-ui/core";
import React from "react";
import ContentEditable from "react-contenteditable";
import sanitizeHtml from "sanitize-html";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    editable: {
      fontFamily: 'sans-serif',
      whiteSpace: 'pre-wrap',
      wordBreak: 'keep-all',
      width: "100%",
      border: 'none',
      padding: '5px',
      paddingBottom: 0,
      resize: 'none',
      margin: 0,
      outline: '0px solid transparent'
    },
    child_notes: {
      marginLeft: "20px"
    },
    noteRow: {
      display: "inline-flex",
      width: "100%",
      '&:hover': {
        '& $expander': {
          color: 'black'
        }
      }
    },
    bullet: {
      width: "18px",
      height: "18px",
      lineHeight: '37px',
      cursor: "pointer"
    },
    expander: {
      width: "15px",
      height: "20px",
      color: '#cecece',
      transition: 'transform 200ms ease 0s',
      lineHeight: '40px'
    },
    expanded: {
      transform: 'rotateZ(90deg)'
    },
    emptySpace: {
      width: "15px"
    }
  }),
);

export interface NotesType {
  id: string;
  content: string;
  child_notes: Array<NotesType>,
  collapsed? : boolean
}

interface Props {
  notes: Array<NotesType>
  className?: string,
  index: string,
  onNoteContentChange: (deepIndex: string, newContent: string) => void,
  addAChildNote: (deepIndex: string) => void,
  handleTabPress: (deepIndex: string) => void,
  handleBackspaceWhenEmpty: (evt: React.KeyboardEvent<HTMLDivElement>, deepIndex: string) => void,
  handleUpKey: (deepIndex: string) => void
  handleDownKey: (deepIndex: string) => void,
  setCollapsedForNote: (deepIndex: string, state: boolean) => void,
  handleShiftTabPress: (deepIndex: string) => void
}

const sanitizeConf = {
  allowedTags: ["b", "i", "em", "strong", "a", "p", "h1"],
  allowedAttributes: { a: ["href"] }
};

// This component is supposed to be a dumb one, all logic related to notes should be handled in RootNote.tsx.
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
          if (evt.shiftKey) {
            props.handleShiftTabPress(deepIndex);
          } else {
            props.handleTabPress(deepIndex);
          }
        } else if (evt.key === "Backspace") {
          props.handleBackspaceWhenEmpty(evt, deepIndex);
        } else if (evt.key === "ArrowUp") {
          evt.preventDefault();
          props.handleUpKey(deepIndex);
        } else if (evt.key === "ArrowDown") {
          evt.preventDefault();
          props.handleDownKey(deepIndex);
        }
      }

      return <div className={props.className} key={deepIndex}>
        <div className={classes.noteRow}>
          {note.child_notes.length > 0 ? (
            <div className={classes.expander} onClick={() => props.setCollapsedForNote(deepIndex, !note.collapsed)}>
              <svg className={!note.collapsed ? classes.expanded : undefined} width="20" height="20" viewBox="0 0 20 20" ><path d="M13.75 9.56879C14.0833 9.76124 14.0833 10.2424 13.75 10.4348L8.5 13.4659C8.16667 13.6584 7.75 13.4178 7.75 13.0329L7.75 6.97072C7.75 6.58582 8.16667 6.34525 8.5 6.5377L13.75 9.56879Z" stroke="none" fill="currentColor"></path></svg>
            </div>
          ): <div className={classes.emptySpace}></div>}
          <div className={classes.bullet}>
            <svg viewBox="0 0 18 18" fill="#747474"><circle cx="9" cy="9" r="3.5"></circle></svg>
          </div>
          <ContentEditable
            id={'note' + deepIndex}
            className={classes.editable}
            tagName="pre"
            html={note.content} // innerHTML of the editable div
            disabled={false} // use true to disable edition
            onChange={(evt) => props.onNoteContentChange(deepIndex, sanitizeHtml(evt.target.value, sanitizeConf))} // handle innerHTML change
            onBlur={(evt) => console.log("blurred")}
            onKeyDown={onKeyDown}
          />
        </div>

        {!note.collapsed && note.child_notes ?
          <Notes
            index={deepIndex}
            className={classes.child_notes}
            notes={note.child_notes}
            onNoteContentChange={props.onNoteContentChange}
            addAChildNote={props.addAChildNote}
            handleTabPress={props.handleTabPress}
            handleBackspaceWhenEmpty={props.handleBackspaceWhenEmpty}
            handleUpKey={props.handleUpKey}
            handleDownKey={props.handleDownKey}
            setCollapsedForNote={props.setCollapsedForNote}
            handleShiftTabPress={props.handleShiftTabPress}
          />
          : null
        }
      </div>
    })}
  </>
}
