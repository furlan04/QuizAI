// ============================================================================
// AuthContext — stato di autenticazione globale.
//
// Modello a cookie httpOnly: il JWT non è leggibile da JS, quindi lo stato di
// login si determina interrogando il server.
//
// Espone:
//   user           : { userId, email, username } | null
//   isAuthenticated: boolean
//   login(user)    : registra l'utente dopo un login riuscito (cookie già impostato)
//   logout()       : chiama POST /auth/logout e azzera lo stato
//   loading        : true durante il controllo iniziale della sessione (/auth/me)
//
// Al mount chiama GET /auth/me per capire se il cookie è ancora valido.
// Il provider si registra anche su `onUnauthorized` dell'apiClient: appena
// arriva un 401, l'utente viene "scollegato" automaticamente.
// ============================================================================

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { onUnauthorized } from '../lib/apiClient';
import { me as fetchMe, logout as logoutRequest } from '../services/AuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Al boot: verifica la sessione tramite il cookie (GET /auth/me).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = await fetchMe();
      if (!cancelled) {
        setUser(current);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback((u) => setUser(u), []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  // Reagisce ai 401 emessi dall'apiClient (es. cookie scaduto).
  useEffect(() => onUnauthorized(() => setUser(null)), []);

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
