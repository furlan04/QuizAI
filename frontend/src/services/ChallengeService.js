import { handleHttpError, handleNetworkError, createAuthHeaders } from './CommonService';
import { getConfig } from '../config/config';

const USER_URL = getConfig('USER_SERVICE_URL');

/** Lista sfide dell'utente. status: 'pending' | 'accepted' | 'completed' (opzionale) */
export const getChallenges = async (token, status = null) => {
  try {
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`${USER_URL}/users/me/challenges${params}`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Sfida un amico su un quiz. */
export const createChallenge = async (username, quizId, token) => {
  try {
    const response = await fetch(`${USER_URL}/users/me/challenges`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: JSON.stringify({ username, quizId }),
    });
    const data = await response.json();
    if (response.ok) return { success: true, ...data };
    return { success: false, message: data.error || 'Errore nella creazione della sfida' };
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Accetta o rifiuta una sfida. action: 'accept' | 'reject' */
export const respondChallenge = async (challengeId, action, token) => {
  try {
    const response = await fetch(`${USER_URL}/users/me/challenges/${challengeId}/respond`, {
      method: 'PUT',
      headers: createAuthHeaders(token),
      body: JSON.stringify({ action }),
    });
    const data = await response.json();
    if (response.ok) return { success: true, ...data };
    return { success: false, message: data.error || 'Errore nella risposta alla sfida' };
  } catch (error) {
    return handleNetworkError(error);
  }
};
