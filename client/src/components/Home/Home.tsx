import { makeStyles, Theme, createStyles, Box } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import React from "react";
import { useAuth } from "../../hooks/use-auth";
import LandingPage from '../LandingPage';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: "30px"
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

  return <Box className={classes.root}>
    {auth?.user ? <Paper elevation={2} className={classes.paper}>
      {auth.user.name}
    </Paper> : <LandingPage />}
  </Box>
}

export default Home;
