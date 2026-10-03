import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchCurrentUser,
  getStoredToken,
  login as loginRequest,
  register as registerRequest,
  storeToken,
} from "../services/api.js";

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
  // The user record is cached in localStorage so a page refresh renders the
  // workspace instantly; the JWT itself is re-checked against the backend on
  // mount (and on every API call via the axios interceptor).
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

  // Restores a saved session: without a token there is nothing to resume;
  // with one, confirm it is still valid by asking the backend who we are.
  // A 401 is handled by the api interceptor (redirects to /login?expired=1).
  useEffect(() => {
    if (!getStoredToken()) {
      persist(null);
      return;
    }
    // Token present: confirm it is still valid. A 401 is handled by the api
    // interceptor (clears + redirects to /login?expired=1).
    fetchCurrentUser().catch(() => {});
  }, [persist]);

  const login = useCallback(
    async ({ email, password }) => {
      const data = await loginRequest({ email, password });
      storeToken(data.token);
      persist(data.user);
      return data.user;
    },
    [persist],
  );

  const signup = useCallback(
    async ({ name, email, password }) => {
      const data = await registerRequest({ name, email, password });
      storeToken(data.token);
      persist(data.user);
      return data.user;
    },
    [persist],
  );

  const logout = useCallback(() => {
    storeToken(null);
    persist(null);
  }, [persist]);

  const value = useMemo(() => ({ user, login, signup, logout }), [user, login, signup, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export default AuthContext;
