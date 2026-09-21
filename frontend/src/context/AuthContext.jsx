import React, { createContext, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ user: null }}>{children}</AuthContext.Provider>
);

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
