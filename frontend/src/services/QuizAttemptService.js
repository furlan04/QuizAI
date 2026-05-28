// src/services/QuizAttemptService.js
import { handleHttpError, handleNetworkError, createAuthHeaders } from './CommonService';
import { getConfig } from '../config/config';

const API_URL = getConfig('API_ENDPOINT');

export const submitQuizAttempt = async (submitData, token) => {
  try {
    const response = await fetch(`${API_URL}/QuizAttempt/submit`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: JSON.stringify(submitData)
    });

    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getLeaderboard = async (quizId, token) => {
  try {
    const response = await fetch(`${API_URL}/QuizAttempt/leaderboard/${quizId}`, {
      headers: createAuthHeaders(token)
    });

    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getMyAttempts = async (quizId, token) => {
  try {
    const response = await fetch(`${API_URL}/QuizAttempt/my-attempts/${quizId}`, {
      headers: createAuthHeaders(token)
    });

    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getAttemptReview = async (attemptId, token) => {
  try {
    const response = await fetch(`${API_URL}/QuizAttempt/${attemptId}/review`, {
      headers: createAuthHeaders(token)
    });

    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};
