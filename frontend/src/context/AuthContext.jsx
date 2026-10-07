import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { clearStoredToken, getStoredToken, storeToken } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      if (!getStoredToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/api/auth/me");
        setUser(data);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, [logout]);

  useEffect(() => {
    window.addEventListener("tdi:unauthorized", logout);
    return () => window.removeEventListener("tdi:unauthorized", logout);
  }, [logout]);

  const login = async (credentials, remember) => {
    const { data } = await api.post("/api/auth/login", credentials);
    storeToken(data.access_token, remember);
    setUser(data.user);
    return data.user;
  };

  const register = async (details) => {
    const { data } = await api.post("/api/auth/register", details);
    storeToken(data.access_token, true);
    sessionStorage.setItem("tdi_flash", "Account created successfully. Welcome to your analyst workspace.");
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, authenticated: Boolean(user) }),
    [user, loading, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
