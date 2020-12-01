import { makeStyles, Theme, createStyles, Box, Paper } from "@material-ui/core";
import React from "react";
import { useAuth } from "../../hooks/use-auth";
import LandingPage from '../LandingPage';
import Notes from "../Notes/Notes";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: "30px"
    },
    paper: {
      width: "100%",
      height: theme.spacing(30),
      paddingLeft: "10%"
    },
  }),
);

function Home() {
  let auth = useAuth();
  const classes = useStyles();

  return <Box className={classes.root}>
    {auth?.user ? <Paper elevation={2} className={classes.paper}><Notes /></Paper>: <LandingPage />}
  </Box>
}

export default Home;
