// Servizi di autenticazione. Tutti tornano un oggetto risultato uniforme.
//
// Dopo login/google il JWT NON è nel body: arriva come cookie httpOnly impostato
// dal server. Il body contiene solo { userId, username, email }. Lo stato di
// login si verifica con `me()` (GET /auth/me), non leggendo il token (illeggibile).
import { authApi } from '../lib/apiClient';
import { authMessage } from './AuthErrorCodes';

const errFrom = (res) => ({
  success: false,
  code: res.errorCode,
  message: authMessage(res.errorCode, res.error),
});

/** Normalizza il body utente del backend in { userId, username, email }. */
const toUser = (data) => ({
  userId:   data?.userId,
  username: data?.username,
  email:    data?.email,
});

export const register = async (username, email, password) => {
  const res = await authApi.post('/auth/register', { username, email, password });
  if (res.ok) return { success: true, ...res.data };
  return errFrom(res);
};

export const login = async (email, password) => {
  const res = await authApi.post('/auth/login', { email, password });
  if (res.ok) return { success: true, user: toUser(res.data) };
  return errFrom(res);
};

export const confirmEmail = async (userId, token) => {
  const res = await authApi.post('/auth/confirm-email', { userId, token });
  if (res.ok) return { success: true };
  return errFrom(res);
};

export const resendConfirmation = async (email) => {
  const res = await authApi.post('/auth/resend-confirmation', { email });
  return { success: res.ok };
};

export const googleLogin = async (idToken) => {
  const res = await authApi.post('/auth/google', { idToken });
  if (res.ok) return { success: true, user: toUser(res.data) };
  return errFrom(res);
};

/**
 * Verifica la sessione corrente leggendo il cookie httpOnly lato server.
 * Ritorna l'utente { userId, username, email } se valida, altrimenti null.
 */
export const me = async () => {
  // auth:false → un 401 qui è la risposta attesa per "non loggato", non un logout.
  const res = await authApi.get('/auth/me', { auth: false });
  return res.ok ? toUser(res.data) : null;
};

/** Cancella il cookie di sessione lato server. */
export const logout = async () => {
  const res = await authApi.post('/auth/logout', undefined, { auth: false });
  return { success: res.ok };
};
