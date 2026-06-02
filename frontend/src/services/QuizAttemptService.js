import { quizApi } from '../lib/apiClient';

/** Avvia una sessione di gioco. */
export const startSession = async (quizId) => {
  const res = await quizApi.post('/sessions', { quizId });
  return res.ok ? res.data : null;
};

/** Risponde a una domanda. */
export const answerQuestion = async (sessionId, questionIndex, selectedIndex) => {
  const res = await quizApi.put(`/sessions/${sessionId}/answer`, { questionIndex, selectedIndex });
  return res.ok ? res.data : null;
};

/** Completa la sessione. */
export const completeSession = async (sessionId) => {
  const res = await quizApi.post(`/sessions/${sessionId}/complete`);
  return res.ok ? res.data : null;
};

export const getSession = async (sessionId) => {
  const res = await quizApi.get(`/sessions/${sessionId}`);
  return res.ok ? res.data : null;
};

export const getLeaderboard = async (quizId) => {
  const res = await quizApi.get(`/quizzes/${quizId}/leaderboard`);
  return res.ok ? res.data : [];
};

export const getMyAttempts = async (quizId) => {
  const res = await quizApi.get(`/users/me/attempts/${quizId}`);
  return res.ok ? res.data : null;
};

/** Deprecati — mantenuti per compatibilità con vecchie pagine. */
export const submitQuizAttempt = async () => ({ success: false, message: 'Usa startSession → answerQuestion → completeSession' });
export const getAttemptReview = async (sessionId) => {
  const res = await quizApi.get(`/sessions/${sessionId}`);
  return res.ok ? res.data : null;
};
