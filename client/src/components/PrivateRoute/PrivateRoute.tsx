import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';

interface privateRouteProps {
  children?: JSX.Element[] | JSX.Element;
  exact: boolean;
  path: string;
}

export function PrivateRoute({ children, exact, path }: privateRouteProps) {
  let auth = useAuth();
  let options: { path?: string; exact?: boolean; } = {};
  if (path)
    options.path = path;
  if (exact)
    options.exact = exact;
  return (
    <Route
      {...options}
      render={({ location }) => auth?.user ? (
        children
      ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location }
            }} />
        )} />
  );
}
