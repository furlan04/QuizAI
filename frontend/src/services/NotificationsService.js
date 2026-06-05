// src/services/NotificationsService.js
//
// Feed di notifiche lato server (persistenti, in-app). Da non confondere con
// NotificationService.js (toast/notiche effimere lato client).
import { userApi } from '../lib/apiClient';

/** Tipi di notifica restituiti dal backend. */
export const NOTIFICATION_KIND = {
  FRIEND_REQUEST: 'friend_request',
  QUIZ_CREATED: 'quiz_created',
};

/** Testo, dettaglio e destinazione di una notifica in base al tipo. */
export function describeNotification(n) {
  switch (n.type) {
    case NOTIFICATION_KIND.QUIZ_CREATED:
      return {
        text: `${n.actorUsername || 'Un amico'} ha creato un nuovo quiz`,
        detail: n.quizTitle || '',
        to: n.quizId ? `/quizzes/${n.quizId}` : '/',
      };
    case NOTIFICATION_KIND.FRIEND_REQUEST:
      return {
        text: `${n.actorUsername || 'Qualcuno'} ti ha inviato una richiesta di amicizia`,
        detail: '',
        to: '/friendship/requests',
      };
    default:
      return { text: 'Nuova notifica', detail: '', to: '/' };
  }
}

export const getNotifications = async ({ unreadOnly = false, limit = 50 } = {}) => {
  const params = new URLSearchParams({ unreadOnly: String(unreadOnly), limit: String(limit) });
  const res = await userApi.get(`/users/me/notifications?${params.toString()}`);
  return res.ok && Array.isArray(res.data) ? res.data : [];
};

export const getUnreadCount = async () => {
  const res = await userApi.get('/users/me/notifications/unread-count');
  return res.ok && res.data ? res.data.count : 0;
};

export const markNotificationRead = async (id) => {
  const res = await userApi.put(`/users/me/notifications/${id}/read`);
  return res.ok;
};

export const markAllNotificationsRead = async () => {
  const res = await userApi.put('/users/me/notifications/read-all');
  return res.ok;
};
