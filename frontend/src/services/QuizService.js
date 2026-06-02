import { quizApi } from '../lib/apiClient';

export const generateQuiz = async (topic, difficulty, numQuestions) => {
  const res = await quizApi.post('/quizzes/generate', { topic, difficulty, numQuestions });
  if (res.ok) return { success: true, ...res.data };
  return { success: false, message: res.error || 'Errore durante la generazione del quiz' };
};

/** Compat con vecchio createQuiz */
export const createQuiz = (topic) => generateQuiz(topic, 'medium', 5);

export const getQuizzes = async ({ topic, difficulty, page = 1, pageSize = 20 } = {}) => {
  const params = new URLSearchParams();
  if (topic)      params.set('topic', topic);
  if (difficulty) params.set('difficulty', difficulty);
  params.set('page', page);
  params.set('pageSize', pageSize);

  const res = await quizApi.get(`/quizzes?${params}`);
  return res.ok ? res.data : { items: [], total: 0, page, pageSize };
};

/** Alias compatibilità */
export const getMyQuizzes = () => getQuizzes();

export const getQuizById = async (quizId) => {
  const res = await quizApi.get(`/quizzes/${quizId}`);
  if (res.status === 202) return { generating: true };
  return res.ok ? res.data : null;
};

/** Compat: alcuni vecchi componenti chiedevano quiz da una location custom */
export const getQuizzesFromLocation = async (location) => {
  const res = await quizApi.get(location);
  return res.ok ? res.data : null;
};
