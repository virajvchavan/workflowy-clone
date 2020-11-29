import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { useAuth } from '../../hooks/use-auth';
import { Link, useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
    link: {
      textDecoration: 'none',
      '&:hover, &:hover, &:visited, &:link, &:active': {
        color: 'unset'
      }
    }
  }),
);

export default function Navbar() {
  let history = useHistory();
  const classes = useStyles();
  let auth = useAuth();

  return (
    <div className={classes.root}>
      <AppBar position="static" color="transparent">
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            <Link to="/" className={classes.link}>
              Moar
              </Link>
          </Typography>
          {auth?.user ? <Button color="inherit" onClick={() => auth?.signout(() => history.push("/login"))}>Logout</Button> : 
            <Button color="inherit" onClick={() => history.push("/login")}>Login</Button>
          }
        </Toolbar>
      </AppBar>
    </div>
  );
}