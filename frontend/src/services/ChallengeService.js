import { userApi } from '../lib/apiClient';

export const getChallenges = async (status = null) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await userApi.get(`/users/me/challenges${qs}`);
  return res.ok ? res.data : [];
};

export const createChallenge = async (username, quizId) => {
  const res = await userApi.post('/users/me/challenges', { username, quizId });
  if (res.ok) return { success: true, ...res.data };
  return { success: false, message: res.error || 'Errore nella creazione della sfida' };
};

export const respondChallenge = async (challengeId, action) => {
  const res = await userApi.put(`/users/me/challenges/${challengeId}/respond`, { action });
  if (res.ok) return { success: true, ...res.data };
  return { success: false, message: res.error || 'Errore nella risposta alla sfida' };
};
