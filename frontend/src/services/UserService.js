import { userApi, quizApi } from '../lib/apiClient';

/** Profilo dell'utente autenticato. Creato al primo accesso. */
export const getUserProfile = async () => {
  const res = await userApi.get('/users/me');
  return res.ok ? res.data : null;
};

/** Profilo pubblico per username. */
export const getSpecificUserProfile = async (username) => {
  const res = await userApi.get(`/users/${encodeURIComponent(username)}`);
  return res.ok ? res.data : null;
};

/** Profilo pubblico per userId (per i quiz che hanno solo createdBy). */
export const getProfileByUserId = async (userId) => {
  const res = await userApi.get(`/users/by-id/${encodeURIComponent(userId)}`);
  return res.ok ? res.data : null;
};

/** Aggiorna bio + avatarUrl. */
export const updateUserProfile = async ({ bio, avatarUrl } = {}) => {
  const res = await userApi.put('/users/me', { bio, avatarUrl });
  return res.ok ? res.data : null;
};

/** Tentativi quiz dell'utente (dal quiz-service). */
export const getUserSettings = async () => {
  const res = await quizApi.get('/users/me');
  return res.ok ? res.data : null;
};
