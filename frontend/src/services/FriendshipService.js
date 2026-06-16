import { userApi } from '../lib/apiClient';

export const getFriendsList = async () => {
  const res = await userApi.get('/users/me/friends');
  return res.ok ? res.data : [];
};

export const getFriendshipRequests = async () => {
  const res = await userApi.get('/users/me/friends/requests');
  return res.ok ? res.data : [];
};

export const sendFriendshipRequest = async (username) => {
  const res = await userApi.post('/users/me/friends/requests', { username });
  if (res.ok) return { success: true, ...res.data };
  return { success: false, message: res.error || "Errore nell'invio della richiesta" };
};

export const respondFriendshipRequest = async (friendshipId, action) => {
  const res = await userApi.put(`/users/me/friends/requests/${friendshipId}`, { action });
  if (res.ok) return { success: true, ...res.data };
  return { success: false, message: res.error || 'Errore nella risposta' };
};

export const removeFriendship = async (username) => {
  const res = await userApi.del(`/users/me/friends/${encodeURIComponent(username)}`);
  if (res.ok) return { success: true };
  return { success: false, message: res.error || "Errore nella rimozione dell'amicizia" };
};

export const getFriendshipStatus = async (username) => {
  const res = await userApi.get(`/users/me/friends/status/${encodeURIComponent(username)}`);
  return res.ok ? res.data : { status: 'none', friendshipId: null };
};
