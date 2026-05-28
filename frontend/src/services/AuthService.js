// src/services/AuthService.js
import { handleNetworkError, createHeaders } from './CommonService';
import { getConfig } from '../config/config';

const API_URL = getConfig('API_ENDPOINT');

export const register = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/Auth/register`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, ...data };
    } else {
      return { success: false, message: data.message || "Errore durante la registrazione" };
    }
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/Auth/login`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      return { success: true, token: data.token, ...data };
    } else {
      return { success: false, message: data.message || "Errore login" };
    }
  } catch (error) {
    return handleNetworkError(error);
  }
};
