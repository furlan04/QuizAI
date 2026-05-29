import { handleHttpError, handleNetworkError, createAuthHeaders } from './CommonService';
import { getConfig } from '../config/config';

const USER_URL = getConfig('USER_SERVICE_URL');
const QUIZ_URL = getConfig('QUIZ_SERVICE_URL');

/** Profilo dell'utente autenticato (user-service). Crea il profilo al primo accesso. */
export const getUserProfile = async (token) => {
  try {
    const response = await fetch(`${USER_URL}/users/me`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Profilo pubblico di un utente per username (user-service). */
export const getSpecificUserProfile = async (username, token) => {
  try {
    const response = await fetch(`${USER_URL}/users/${username}`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Aggiorna bio e avatar_url dell'utente autenticato (user-service). */
export const updateUserProfile = async (token, { bio, avatarUrl } = {}) => {
  try {
    const response = await fetch(`${USER_URL}/users/me`, {
      method: 'PUT',
      headers: createAuthHeaders(token),
      body: JSON.stringify({ bio, avatar_url: avatarUrl }),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Storico tentativi quiz dell'utente autenticato (quiz-service). */
export const getUserSettings = async (token) => {
  try {
    const response = await fetch(`${QUIZ_URL}/users/me`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Dettaglio tentativo su un quiz specifico (quiz-service). */
export const getMyAttemptForQuiz = async (quizId, token) => {
  try {
    const response = await fetch(`${QUIZ_URL}/users/me/attempts/${quizId}`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};
