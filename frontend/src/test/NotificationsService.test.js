import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  describeNotification,
  NOTIFICATION_KIND,
} from '../services/NotificationsService';
import { setToken, clearToken } from '../lib/apiClient';
import { server } from './msw/server';

const USER = 'http://localhost:5002';

describe('NotificationsService', () => {
  beforeEach(() => { clearToken(); setToken('tok'); });

  it('getNotifications ritorna la lista del backend', async () => {
    const items = await getNotifications();
    expect(Array.isArray(items)).toBe(true);
    expect(items[0].type).toBe('quiz_created');
  });

  it('getNotifications su errore ritorna lista vuota', async () => {
    server.use(
      http.get(`${USER}/users/me/notifications`, () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }))
    );
    const items = await getNotifications();
    expect(items).toEqual([]);
  });

  it('getUnreadCount estrae count', async () => {
    expect(await getUnreadCount()).toBe(1);
  });

  it('markNotificationRead ritorna true su 204', async () => {
    expect(await markNotificationRead('n1')).toBe(true);
  });

  it('markAllNotificationsRead ritorna true su 204', async () => {
    expect(await markAllNotificationsRead()).toBe(true);
  });

  it('describeNotification mappa tipo quiz_created su /quizzes/:id', () => {
    const d = describeNotification({
      type: NOTIFICATION_KIND.QUIZ_CREATED, actorUsername: 'bob', quizId: 'q9', quizTitle: 'Geo',
    });
    expect(d.to).toBe('/quizzes/q9');
    expect(d.text).toContain('bob');
    expect(d.detail).toBe('Geo');
  });

  it('describeNotification mappa friend_request su /friendship/requests', () => {
    const d = describeNotification({ type: NOTIFICATION_KIND.FRIEND_REQUEST, actorUsername: 'carol' });
    expect(d.to).toBe('/friendship/requests');
    expect(d.text).toContain('carol');
  });
});
