import { makeStyles, Theme, createStyles, Box } from "@material-ui/core";
import React from "react";
import { useAuth } from "../../hooks/use-auth";
import LandingPage from '../LandingPage';
import RootNote from "../Notes/RootNote";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: "30px"
    },
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

function Home() {
  let auth = useAuth();
  const classes = useStyles();

  if (auth?.loading) return <h3>Loggin you in...</h3>;

  return <Box className={classes.root}>
    {auth?.user ? <RootNote />: <LandingPage />}
  </Box>
}

export default Home;
