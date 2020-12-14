import { createContext, useContext, useEffect, useState } from "react";

// todo: use promises instead of callbacks
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
        cb(data.name, data.token);
      } else {
        cb("", null);
      }
    }).catch(err => {
      console.log("error calling login api: ", err);
      cb("", null);
    });
  },
  autoSignin(auth_token: string, cb: (status: "success" | "failed") => void) {
    // make a fetch call to api to check if the token is still valid
    fetch("/api/users/auto_login", {
      method: "GET",
      headers: {
        'Authorization': "Bearer " + auth_token,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }}).then(resp => resp.json())
    .then(data => {
      if (data.status === "logged_in") {
        cb("success");
      } else {
        cb("failed");
      }
    }).catch(err => {
      console.log("auto login failed: ", err);
      cb("failed");
    });
  },
  signup(name: string, email: string, password: string, cb: (name: string, token: string | null) => void) {
    fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        name
      })
    }).then(resp => resp.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('user', JSON.stringify(data));
        cb(data.name, data.token);
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
type signupType = (name: string, email: string, password: string, cb: (status: string) => void) => void

interface userContextType  {
  user: {
      name: string;
      token: string | null;
  } | null;
  loading: Boolean;
  signin: signinType;
  signout: (cb: () => void) => void;
  signup: signupType
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
  const [loading, setLoading] = useState<Boolean>(true);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      const foundUser = JSON.parse(loggedInUser);
      apiAuth.autoSignin(foundUser.token, (status) => {
        if (status === "success") {
          setUser(foundUser);
        } else {
          // auth token has expired
          localStorage.clear();
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
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

  const signup = (name: string, email: string, password: string, cb: (status: string) => void) => {
    return apiAuth.signup(name, email, password, (name, token) => {
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
    loading,
    signin,
    signout,
    signup
  };
}
