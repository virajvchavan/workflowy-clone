import { Button, CircularProgress, Container, createStyles, Grid, makeStyles, TextField, Theme } from '@material-ui/core';
import React from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/use-auth';
import { useState, useEffect } from 'react';

interface LocationState {
  from: {
    pathname: string;
  };
}

interface ErrorType {
  passsword?: string,
  passwordConfirmation?: string
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

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<ErrorType>({});
  const [isLoading, setIsLoading] = useState(false);

  const classes = useStyles();
  let history = useHistory();
  let location = useLocation<LocationState>();
  let auth = useAuth();

  let { from } = location.state || { from: { pathname: "/" } };
  let signup = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setIsLoading(true);
    event.preventDefault();
    if (email && password && passwordConfirmation) {
      auth?.signup(name, email, password, () => {
        history.replace(from);
      });
    }
  };

  useEffect(() => {
    let newErrors: ErrorType = {};
    if (password && password.length < 4) {
      newErrors.passsword = "Min length 4";
    }
    if (passwordConfirmation && password !== passwordConfirmation) {
      newErrors.passwordConfirmation = "Password mismatch";
    }
    setErrors(newErrors);
  }, [password, passwordConfirmation])

  // todo: have more sophisticated form validations
  let isFormValid = name && email && password && passwordConfirmation && password === passwordConfirmation;

  return <Container className={classes.root}>
    <form>
      <Grid container spacing={1} justify="center">
        <h3>Create a new account</h3>
        <TextField
            type="text" id="name" label="Name" variant="outlined"
            required={true} fullWidth={true} margin="dense"
            onChange={({ target }) => setName(target.value)}
          />
          <TextField
            type="email" id="email" label="Email" variant="outlined"
            required={true} fullWidth={true} margin="dense" autoComplete="email"
            onChange={({ target }) => setEmail(target.value)}
          />
          <TextField
            type="password" id="password" label="Password" variant="outlined"
            required={true} fullWidth={true} margin="dense" autoComplete="current-password"
            error={errors.passsword ? true : false} helperText={errors.passsword}
            onChange={({ target }) => setPassword(target.value)}
          />
          <TextField
            type="password" id="confirm-password" label="Confirm Password" variant="outlined"
            required={true} fullWidth={true} margin="dense"
            error={errors.passwordConfirmation ? true : false} helperText={errors.passwordConfirmation}
            onChange={({ target }) => setPasswordConfirmation(target.value)}
          />
          <Button disabled={!isFormValid || isLoading} className={classes.btn} type="submit" variant="outlined" color="primary" onClick={signup}>
            Signup
            {isLoading && <CircularProgress size={20} className={classes.loading} />}
          </Button>
      </Grid>
    </form>
    <hr/>
    <Link to="/login">Log in to extisting account</Link>
  </Container>
}

export default Signup;
