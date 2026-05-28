// src/services/QuizService.js
import { handleHttpError, handleNetworkError, createAuthHeaders } from './CommonService';
import { getConfig } from '../config/config';

const API_URL = getConfig('API_ENDPOINT');

export const createQuiz = async (topic, token) => {
  try {
    const response = await fetch(`${API_URL}/Quiz/${topic}`, {
      method: "POST",
      headers: createAuthHeaders(token),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, ...data };
    } else {
      return { success: false, message: data.message || "Errore durante la creazione del quiz" };
    }
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getMyQuizzes = async (token) => {
  try {
    const response = await fetch(`${API_URL}/Quiz`, {
      headers: createAuthHeaders(token)
    });
    
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getQuizzes = async (token, userId) => {
  try {
    const response = await fetch(`${API_URL}/Quiz?userId=${userId}`, {
      headers: createAuthHeaders(token)
    });
    
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getQuizzesFromLocation = async (token, location) => {
  try {
    const response = await fetch(`${API_URL}${location}`, {
      headers: createAuthHeaders(token)
    });
    
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getQuizById = async (quizId, token) => {
  try {
    const response = await fetch(`${API_URL}/Quiz/${quizId}`, {
      headers: createAuthHeaders(token)
    });
    
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};
