import { handleNetworkError, createHeaders } from './CommonService';
import { getConfig } from '../config/config';
import { authMessage } from './AuthErrorCodes';

const AUTH_URL = getConfig('AUTH_SERVICE_URL');

// Wrappa le risposte d'errore: estrae {code, error} dal backend e produce
// un message localizzato in base al code. Il code resta a disposizione del chiamante
// per logica condizionale (es. mostrare "reinvia email" solo su email_not_confirmed).
const errorResult = (data) => ({
  success: false,
  code: data?.code || null,
  message: authMessage(data?.code, data?.error),
});

export const register = async (username, email, password) => {
  try {
    const response = await fetch(`${AUTH_URL}/auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (response.ok) return { success: true, ...data };
    return errorResult(data);
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const login = async (email, password) => {
  try {
    const response = await fetch(`${AUTH_URL}/auth/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok && data.token) return { success: true, ...data };
    return errorResult(data);
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Conferma l'email tramite token ricevuto via email. */
export const confirmEmail = async (userId, token) => {
  try {
    const response = await fetch(`${AUTH_URL}/auth/confirm-email`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ userId, token }),
    });
    if (response.ok) return { success: true };
    const data = await response.json().catch(() => ({}));
    return errorResult(data);
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Reinvia l'email di conferma. Ritorna sempre success per non rivelare l'esistenza dell'account. */
export const resendConfirmation = async (email) => {
  try {
    const response = await fetch(`${AUTH_URL}/auth/resend-confirmation`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ email }),
    });
    return { success: response.ok };
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Login via ID token Google (ottenuto da Google Identity Services nel browser). */
export const googleLogin = async (idToken) => {
  try {
    const response = await fetch(`${AUTH_URL}/auth/google`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ idToken }),
    });
    const data = await response.json();
    if (response.ok && data.token) return { success: true, ...data };
    return errorResult(data);
  } catch (error) {
    return handleNetworkError(error);
  }
};
