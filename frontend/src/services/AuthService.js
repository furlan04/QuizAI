// Servizi di autenticazione. Tutti tornano un oggetto risultato uniforme.
import { authApi } from '../lib/apiClient';
import { authMessage } from './AuthErrorCodes';

const errFrom = (res) => ({
  success: false,
  code: res.errorCode,
  message: authMessage(res.errorCode, res.error),
});

export const register = async (username, email, password) => {
  const res = await authApi.post('/auth/register', { username, email, password });
  if (res.ok) return { success: true, ...res.data };
  return errFrom(res);
};

export const login = async (email, password) => {
  const res = await authApi.post('/auth/login', { email, password });
  if (res.ok && res.data?.token) return { success: true, ...res.data };
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
  if (res.ok && res.data?.token) return { success: true, ...res.data };
  return errFrom(res);
};
