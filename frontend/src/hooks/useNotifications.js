import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/NotificationsService";

const POLL_INTERVAL_MS = 30000;

/**
 * Carica le notifiche dell'utente e il conteggio dei non letti, con polling
 * periodico. Espone azioni per segnare letto/tutti letti aggiornando lo stato
 * locale in modo ottimistico.
 */
export function useNotifications({ enabled = true, limit = 20 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const limitRef = useRef(limit);
  limitRef.current = limit;

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const [items, count] = await Promise.all([
        getNotifications({ limit: limitRef.current }),
        getUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const markRead = useCallback(async (id) => {
    const ok = await markNotificationRead(id);
    if (ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    return ok;
  }, []);

  const markAllRead = useCallback(async () => {
    const ok = await markAllNotificationsRead();
    if (ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
    return ok;
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const t = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [enabled, refresh]);

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead };
}
