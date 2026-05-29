import { handleNetworkError, createHeaders } from './CommonService';
import { getConfig } from '../config/config';

const AUTH_URL = getConfig('AUTH_SERVICE_URL');

export const register = async (username, email, password) => {
  try {
    const response = await fetch(`${AUTH_URL}/auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (response.ok) return { success: true, ...data };
    return { success: false, message: data.error || 'Errore durante la registrazione' };
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
    return { success: false, message: data.error || 'Credenziali non valide' };
  } catch (error) {
    return handleNetworkError(error);
  }
};
