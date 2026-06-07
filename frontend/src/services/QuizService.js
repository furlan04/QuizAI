import { quizApi } from '../lib/apiClient';

export const generateQuiz = async (topic, difficulty, numQuestions, deepSearch = false) => {
  const res = await quizApi.post('/quizzes/generate', { topic, difficulty, numQuestions, deepSearch });
  if (res.ok) return { success: true, ...res.data };
  return { success: false, message: res.error || 'Errore durante la generazione del quiz' };
};

/**
 * Genera un quiz a partire da un documento (PDF/DOCX/PPTX).
 * Il file viene caricato sul quiz-service che lo inoltra all'AI per l'estrazione
 * del testo; il file non viene salvato da nessuna parte.
 */
export const generateQuizFromFile = async (file, difficulty, numQuestions) => {
  const form = new FormData();
  form.append('file', file);
  form.append('difficulty', difficulty);
  form.append('numQuestions', String(numQuestions));

  const res = await quizApi.post('/quizzes/generate-from-file', form);
  if (res.ok) return { success: true, ...res.data };
  return { success: false, message: res.error || 'Errore durante la generazione del quiz dal documento' };
};

export const getQuizzes = async ({ topic, difficulty, page = 1, pageSize = 20 } = {}) => {
  const params = new URLSearchParams();
  if (topic)      params.set('topic', topic);
  if (difficulty) params.set('difficulty', difficulty);
  params.set('page', page);
  params.set('pageSize', pageSize);

  const res = await quizApi.get(`/quizzes?${params}`);
  return res.ok ? res.data : { items: [], total: 0, page, pageSize };
};

export const getQuizById = async (quizId) => {
  const res = await quizApi.get(`/quizzes/${quizId}`);
  if (res.status === 202) return { generating: true };
  return res.ok ? res.data : null;
};
