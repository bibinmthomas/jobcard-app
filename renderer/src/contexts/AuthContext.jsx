import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { id, username, role }
  const [loading, setLoading] = useState(true);    // checking for existing session

  // On mount, check if there's an active session in the main process
  useEffect(() => {
    api.auth.getSession()
      .then(session => setUser(session))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const session = await api.auth.login({ username, password });
    setUser(session);
    return session;
  }, []);

  const register = useCallback(async (username, password) => {
    const session = await api.auth.register({ username, password });
    setUser(session);
    return session;
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
