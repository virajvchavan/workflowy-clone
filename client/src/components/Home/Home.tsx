import { makeStyles, Theme, createStyles } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import React from "react";
import { useAuth } from "../../hooks/use-auth";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      width: "100%",
      height: theme.spacing(30)
    },
  }),
);

function Home() {
  let auth = useAuth();
  const classes = useStyles();

  return <div>
    <h3>Notes</h3>
    {auth?.user ? <Paper elevation={2} className={classes.paper} /> : <h3>You need to be logged in to see this</h3>}
  </div>
}

export default Home;
