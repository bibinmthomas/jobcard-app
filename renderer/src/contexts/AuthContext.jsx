import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);   // { authenticated: true } | null
  const [passwordStatus, setPasswordStatus] = useState(null); // { needsReset, isExpired } | null
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    api.auth.getSession()
      .then(session => setUser(session))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (password) => {
    const result = await api.auth.login(password);
    setUser({ authenticated: true });
    setPasswordStatus({ needsReset: result.needsReset, isExpired: result.isExpired });
    return result;
  }, []);

  const resetPassword = useCallback(async (newPassword) => {
    await api.auth.resetPassword(newPassword);
    setPasswordStatus({ needsReset: false, isExpired: false });
  }, []);

  const changeExpiredPassword = useCallback(async (oldPassword, newPassword) => {
    await api.auth.changeExpiredPassword(oldPassword, newPassword);
    setPasswordStatus({ needsReset: false, isExpired: false });
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
    setPasswordStatus(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, passwordStatus, loading, login, resetPassword, changeExpiredPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
