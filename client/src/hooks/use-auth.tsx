import { createContext, useContext, useState } from "react";

const apiAuth = {
  signin(email: string, password: string, cb: (name: string, token: string) => void) {
    // make fetch call to the login api
    cb("Viraj", "bleh");
  },
  signout(cb: () => void) {
    cb();
  },
  autoSignin(cb: () => boolean) {
    // make a fetch call to api to check if the token is still valid
  },
  signup(email: string, password: string, cb: (name: string, token: string) => void) {
    // make a fetch call to api to create the user account
  }
};
type signinType = (email: string, password: string, cb: () => void) => void

interface userContextType  {
  user: {
      name: string;
      token: string;
  } | null;
  signin: signinType;
  signout: () => void;
  signup: signinType
}

const authContext = createContext<userContextType | null>(null);

export function ProvideAuth({ children }: { children: JSX.Element }) {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>
      {children}
    </authContext.Provider>
}

export function useAuth() {
  return useContext(authContext);
}

function useProvideAuth() {
  const [user, setUser] = useState<{name: string, token: string} | null>(null);

  const signin = (email: string, password: string, cb: () => void) => {
    return apiAuth.signin(email, password, (name, token) => {
      setUser({ name: name, token: token });
      cb();
    });
  };

  const signout = () => {
    return apiAuth.signout(() => {
      setUser(null);
    });
  };

  const signup = (email: string, password: string, cb: () => void) => {
    return apiAuth.signup(email, password, (name, token) => {
      setUser({ name: name, token: token });
      cb();
    });
  };

  return {
    user,
    signin,
    signout,
    signup
  };
}
