import { handleHttpError, handleNetworkError, createAuthHeaders } from './CommonService';
import { getConfig } from '../config/config';

const QUIZ_URL = getConfig('QUIZ_SERVICE_URL');

/**
 * Avvia la generazione di un quiz (asincrona — polling su getQuizById).
 * @returns { quiz_id, status: 'generating' }
 */
export const generateQuiz = async (topic, difficulty, numQuestions, token) => {
  try {
    const response = await fetch(`${QUIZ_URL}/quizzes/generate`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: JSON.stringify({ topic, difficulty, numQuestions }),
    });
    const data = await response.json();
    if (response.ok) return { success: true, ...data };
    return { success: false, message: data.error || 'Errore durante la generazione del quiz' };
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Compatibilità con vecchio createQuiz(topic, token) */
export const createQuiz = (topic, token) => generateQuiz(topic, 'medium', 5, token);

export const getQuizzes = async (token, { topic, difficulty, page = 1, pageSize = 20 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (topic)      params.set('topic', topic);
    if (difficulty) params.set('difficulty', difficulty);
    params.set('page', page);
    params.set('pageSize', pageSize);

    const response = await fetch(`${QUIZ_URL}/quizzes?${params}`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Alias compatibilità */
export const getMyQuizzes = (token) => getQuizzes(token);

/** Alias compatibilità — recupera quiz da un path relativo arbitrario. */
export const getQuizzesFromLocation = async (token, location) => {
  try {
    const response = await fetch(`${QUIZ_URL}${location}`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getQuizById = async (quizId, token) => {
  try {
    const response = await fetch(`${QUIZ_URL}/quizzes/${quizId}`, {
      headers: createAuthHeaders(token),
    });
    if (response.status === 202) return { generating: true };
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};
