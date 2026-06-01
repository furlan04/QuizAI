import { handleHttpError, handleNetworkError, createAuthHeaders } from './CommonService';
import { getConfig } from '../config/config';

const QUIZ_URL = getConfig('QUIZ_SERVICE_URL');

/**
 * @deprecated Usa startSession + answerQuestion + completeSession.
 * Mantenuto per compatibilità con le pagine esistenti.
 */
export const submitQuizAttempt = async (submitData, token) => {
  console.warn('submitQuizAttempt è deprecato. Usa startSession/answerQuestion/completeSession.');
  return { success: false, message: 'Usa il nuovo flow: startSession → answerQuestion → completeSession' };
};

/**
 * @deprecated Usa getMyAttempts(quizId, token).
 */
export const getAttemptReview = async (attemptId, token) => {
  try {
    const response = await fetch(`${QUIZ_URL}/sessions/${attemptId}`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

/**
 * Avvia una sessione di gioco per un quiz.
 * @returns { sessionId, quizId, questions: [{ text, options }] }
 */
export const startSession = async (quizId, token) => {
  try {
    const response = await fetch(`${QUIZ_URL}/sessions`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: JSON.stringify({ quizId }),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

/**
 * Risponde a una domanda nella sessione.
 * @returns { isCorrect, correctIndex, explanation }
 */
export const answerQuestion = async (sessionId, questionIndex, selectedIndex, token) => {
  try {
    const response = await fetch(`${QUIZ_URL}/sessions/${sessionId}/answer`, {
      method: 'PUT',
      headers: createAuthHeaders(token),
      body: JSON.stringify({ questionIndex, selectedIndex }),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

/**
 * Completa la sessione e calcola il punteggio finale.
 * @returns { score, totalQuestions, percentage }
 */
export const completeSession = async (sessionId, token) => {
  try {
    const response = await fetch(`${QUIZ_URL}/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getSession = async (sessionId, token) => {
  try {
    const response = await fetch(`${QUIZ_URL}/sessions/${sessionId}`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getLeaderboard = async (quizId, token) => {
  try {
    const response = await fetch(`${QUIZ_URL}/quizzes/${quizId}/leaderboard`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getMyAttempts = async (quizId, token) => {
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
