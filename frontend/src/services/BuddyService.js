import { fileApi, userApi, aiApi } from '../lib/apiClient';

export const uploadBuddyDocument = async (file) => {
  const form = new FormData();
  form.append('file', file);
  
  const res = await fileApi.post('/files/buddy/upload', form);
  if (res.ok) return { success: true, ...res.data };
  return { success: false, message: res.error || 'Errore durante l\'upload del documento' };
};

export const createBuddySession = async (sessionId, title) => {
  const res = await userApi.post('/users/buddy/sessions', { sessionId, title });
  if (res.ok) return { success: true, ...res.data };
  return { success: false, message: res.error || 'Errore durante la creazione della sessione' };
};

export const getBuddySessions = async () => {
  const res = await userApi.get('/users/buddy/sessions');
  if (res.ok) return res.data;
  return [];
};

export const getBuddySession = async (sessionId) => {
  const res = await userApi.get(`/users/buddy/sessions/${sessionId}`);
  if (res.ok) return res.data;
  return null;
};

export const updateBuddySessionHistory = async (sessionId, history) => {
  const res = await userApi.patch(`/users/buddy/sessions/${sessionId}`, { history });
  return res.ok;
};

export const deleteBuddySession = async (sessionId) => {
  const res = await userApi.del(`/users/buddy/sessions/${sessionId}`);
  return res.ok;
};

export const chatWithBuddy = async (sessionId, userId, message, history, chatTitle, userName) => {
  const res = await aiApi.post('/ai/buddy/chat', { session_id: sessionId, user_id: userId, message, history, chat_title: chatTitle, username: userName });
  if (res.ok) return { success: true, ...res.data };
  return { success: false, message: res.error || 'Errore durante la chat con Buddy' };
};
