import { Box, Button, CircularProgress, Container, createStyles, FormHelperText, Grid, makeStyles, TextField, Theme } from '@material-ui/core';
import React from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/use-auth';
import { useState, useEffect } from 'react';

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
    },
    loading: {
      marginLeft: "10px"
    }
  }),
);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const classes = useStyles();
  let history = useHistory();
  let location = useLocation<LocationState>();
  let auth = useAuth();

  useEffect(() => {
    setError("");
  }, [email, password]);

  let { from } = location.state || { from: { pathname: "/" } };
  let login = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setIsLoading(true);
    event.preventDefault();
    if (email && password) {
      auth?.signin(email, password, (status) => {
        if (status === "success") {
          history.replace(from);
        } else {
          setError("Invalid credentials");
          setIsLoading(false);
        }
      });
    }
  };

  // todo: have more sophisticated form validations
  let isFormValid = email && password;

  return <Container className={classes.root}>
    <form>
      <h3>Log in to an existing account</h3>
      <Grid container spacing={1} justify="center" >
        <TextField
          type="email" id="email" label="Email" variant="outlined"
          required={true} fullWidth={true} margin="dense" autoComplete="email"
          onChange={({ target }) => setEmail(target.value)} error={error ? true : false}
        />
        <TextField
          type="password" id="password" label="Password" variant="outlined"
          required={true} fullWidth={true} margin="dense" autoComplete="current-password"
          onChange={({ target }) => setPassword(target.value)} error={error ? true : false} helperText={error}
        />
        <br/>
        <Button disabled={!isFormValid || isLoading} className={classes.btn} type="submit" variant="outlined" color="primary" onClick={login}>
          Login
          {isLoading && <CircularProgress size={20} className={classes.loading} />}
        </Button>
      </Grid>
    </form>
    <hr/>
    <Link to="/signup">Create a new account</Link>
  </Container>
}

export default Login;
