import { createContext, useContext, useEffect, useState } from "react";

const apiAuth = {
  signin(email: string, password: string, cb: (name: string, token: string | null) => void) {
    fetch("/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    }).then(resp => resp.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('user', JSON.stringify(data));
        cb("Viraj", data.token);
      } else {
        cb("", null);
      }
    }).catch(err => {
      console.log("error calling login api: ", err);
      cb("", null);
    });
  },
  autoSignin(cb: () => boolean) {
    // make a fetch call to api to check if the token is still valid
  },
  signup(email: string, password: string, cb: (name: string, token: string | null) => void) {
    fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    }).then(resp => resp.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('user', JSON.stringify(data));
        cb("Viraj", data.token);
      } else {
        cb("", null);
      }
    }).catch(err => {
      console.log("error calling signup api: ", err);
      cb("", null);
    });
  }
};

type signinType = (email: string, password: string, cb: (status: string) => void) => void

interface userContextType  {
  user: {
      name: string;
      token: string | null;
  } | null;
  signin: signinType;
  signout: (cb: () => void) => void;
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
  const [user, setUser] = useState<{name: string, token: string | null} | null>(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      const foundUser = JSON.parse(loggedInUser);
      setUser(foundUser);
    }
  }, []);

  const signin = (email: string, password: string, cb: (status: string) => void) => {
    return apiAuth.signin(email, password, (name, token) => {
      if (token) {
        setUser({ name: name, token: token });
        cb("success");
      } else {
        cb("error");
      }
    });
  };

  const signout = (cb: () => void) => {
    localStorage.clear();
    setUser(null);
    cb();
  };

  const signup = (email: string, password: string, cb: (status: string) => void) => {
    return apiAuth.signup(email, password, (name, token) => {
      if (token) {
        setUser({ name: name, token: token });
        cb("success");
      } else {
        cb("error");
      }
    });
  };

  return {
    user,
    signin,
    signout,
    signup
  };
}
