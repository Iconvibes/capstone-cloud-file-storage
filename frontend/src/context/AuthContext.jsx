import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { demoUser } from "../services/mockData";

const AuthContext = createContext(null);
const STORAGE_KEY = "lumen-vault-user";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const persist = useCallback((nextUser) => {
    setUser(nextUser);
    try {
      if (nextUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — session stays in memory only */
    }
  }, []);

  const login = useCallback(
    async ({ email }) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const known = readStoredUser();
      const account = known?.email?.toLowerCase() === email.toLowerCase() ? known : { ...demoUser, email };
      persist(account);
      return account;
    },
    [persist],
  );

  const signup = useCallback(
    async ({ name, email }) => {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const account = { ...demoUser, name: name || demoUser.name, email };
      persist(account);
      return account;
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo(
    () => ({ user, login, signup, logout }),
    [user, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export default AuthContext;

