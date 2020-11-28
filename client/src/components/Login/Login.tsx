import { Button } from '@material-ui/core';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';

interface LocationState {
  from: {
    pathname: string;
  };
}

function Login() {
  let history = useHistory();
  let location = useLocation<LocationState>();
  let auth = useAuth();

  let { from } = location.state || { from: { pathname: "/" } };
  let login = () => {
    auth?.signin(() => {
      history.replace(from);
    });
  };
  return <Button color="primary" onClick={login}>Login</Button>;
}

export default Login;
