import { Button, Container, createStyles, Grid, makeStyles, TextField, Theme } from '@material-ui/core';
import React from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { useState } from 'react';

interface LocationState {
  from: {
    pathname: string;
  };
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: "20px",
      maxWidth: "300px"
    },
    btn: {
      margin: "10px 0",
    }
  }),
);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const classes = useStyles();
  let history = useHistory();
  let location = useLocation<LocationState>();
  let auth = useAuth();

  let { from } = location.state || { from: { pathname: "/" } };
  let login = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    if (email && password) {
      auth?.signin(email, password, () => {
        history.replace(from);
      });
    }
  };

  return <Container className={classes.root}>
    <form>
      <h3>Log in to an existing account</h3>
      <Grid container spacing={1} justify="center" >
        <TextField
          type="email" id="email" label="Email" variant="outlined"
          required={true} fullWidth={true} margin="dense" autoComplete="email"
          onChange={({ target }) => setEmail(target.value)}
        />
        <TextField
          type="password" id="password" label="Password" variant="outlined"
          required={true} fullWidth={true} margin="dense" autoComplete="current-password"
          onChange={({ target }) => setPassword(target.value)}
        />
        <br/>
        <Button className={classes.btn} type="submit" variant="outlined" color="primary" onClick={login}>Login</Button>
      </Grid>
    </form>
    <hr/>
    <Link to="/signup">Create a new account</Link>
  </Container>
}

export default Login;
