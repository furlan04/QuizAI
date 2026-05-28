// src/services/CommonService.js
import { getConfig } from '../config/config';

// Utility per ottenere il token JWT dal sessionStorage
export const getAuthToken = () => {
  return sessionStorage.getItem(getConfig('AUTH_CONFIG.TOKEN_KEY'));
};

// Utility per verificare se l'utente è autenticato
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

// Utility per rimuovere il token e fare logout
export const logout = () => {
  sessionStorage.removeItem(getConfig('AUTH_CONFIG.TOKEN_KEY'));
};

// Utility per gestire gli errori HTTP comuni
export const handleHttpError = (response) => {
  if (!response.ok) {
    throw new Error(`Errore HTTP: ${response.status}`);
  }
  return response;
};

// Utility per gestire gli errori di rete
export const handleNetworkError = (error) => {
  console.error("Errore di rete:", error);
  throw new Error("Errore di connessione al server");
};

// Utility per creare headers comuni per le richieste autenticate
export const createAuthHeaders = (token) => {
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
};

// Utility per creare headers comuni per le richieste non autenticate
export const createHeaders = () => {
  return {
    "Content-Type": "application/json"
  };
};

export const createAuthHeadersNoType = (token) => {
  return {
    "Authorization": `Bearer ${token}`,
  };
};

// Utility per gestire i timeout delle richieste
export const createFetchWithTimeout = (url, options, timeout = getConfig('HTTP_CONFIG.TIMEOUT')) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
};
