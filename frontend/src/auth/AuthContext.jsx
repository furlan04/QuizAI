// ============================================================================
// AuthContext — stato di autenticazione globale.
//
// Espone:
//   user           : { userId, email, username } | null
//   isAuthenticated: boolean
//   login(token)   : salva il token e aggiorna lo stato
//   logout()       : cancella il token e aggiorna lo stato
//   loading        : true durante l'inizializzazione
//
// Il provider si registra anche su `onUnauthorized` dell'apiClient: appena
// arriva un 401, l'utente viene "scollegato" automaticamente.
// ============================================================================

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getToken, setToken as saveToken, clearToken, onUnauthorized } from '../lib/apiClient';

const AuthContext = createContext(null);

/** Decodifica il payload del JWT. Ritorna null se assente o malformato. */
const decodeJwt = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId:   payload.sub,
      email:    payload.email,
      username: payload.username,
      exp:      payload.exp,
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => decodeJwt(getToken()));
  const [loading, setLoading] = useState(false);

  const login = useCallback((token) => {
    saveToken(token);
    setUser(decodeJwt(token));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Reagisce ai 401 emessi dall'apiClient.
  useEffect(() => onUnauthorized(() => setUser(null)), []);

  // Controlla scadenza del token al mount e periodicamente.
  useEffect(() => {
    if (!user?.exp) return undefined;
    const checkExpiry = () => {
      if (Date.now() / 1000 >= user.exp) logout();
    };
    checkExpiry();
    const id = setInterval(checkExpiry, 60_000);
    return () => clearInterval(id);
  }, [user?.exp, logout]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    setLoading,
  }), [user, login, logout, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Hook per leggere lo stato di autenticazione. */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
};
