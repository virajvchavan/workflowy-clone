import { makeStyles, Theme, createStyles } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import React from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      width: "100%",
      height: theme.spacing(30)
    },
  }),
);

function Home() {
  const classes = useStyles();
  return <div>
    <h3>Notes</h3>
    <Paper elevation={2} className={classes.paper} />
  </div>
}

export default Home;
