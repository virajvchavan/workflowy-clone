import { createContext, useContext, useState } from "react";

const fakeAuth = {
  isAuthenticated: false,
  signin(cb: () => void) {
    fakeAuth.isAuthenticated = true;
    setTimeout(cb, 100); // fake async
  },
  signout(cb: () => void) {
    fakeAuth.isAuthenticated = false;
    setTimeout(cb, 100);
  }
};

interface userContextType  {
  user: {
      name: string;
      token: string;
  } | null;
  signin: (cb: () => void) => void;
  signout: () => void;
}

const authContext = createContext<userContextType | null>(null);

export function ProvideAuth({ children }: { children: JSX.Element[] }) {
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

  const signin = (cb: () => void) => {
    return fakeAuth.signin(() => {
      setUser({ name: "viraj", token: "hey" });
      cb();
    });
  };

  const signout = () => {
    return fakeAuth.signout(() => {
      setUser(null);
    });
  };

  return {
    user,
    signin,
    signout
  };
}
