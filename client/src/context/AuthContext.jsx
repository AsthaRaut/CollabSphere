import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe, loginUser, registerUser } from "../services/api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const persist = useCallback((data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  // validate stored token on first load
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setReady(true);
      return;
    }
    getMe()
      .then((d) => setUser(d.user))
      .catch(() => logout())
      .finally(() => setReady(true));
  }, [logout]);

  useEffect(() => {
    window.addEventListener("cs-unauthorised", logout);
    return () => window.removeEventListener("cs-unauthorised", logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      ready,
      logout,
      login: async (form) => persist(await loginUser(form)),
      register: async (form) => persist(await registerUser(form))
    }),
    [user, ready, logout, persist]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
