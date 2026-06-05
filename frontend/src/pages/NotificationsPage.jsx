import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { describeNotification } from "../services/NotificationsService";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications({ limit: 50 });

  const open = async (n) => {
    const { to } = describeNotification(n);
    if (!n.read) await markRead(n.id);
    navigate(to);
  };

  return (
    <div className="friendship-requests-container">
      <div className="friendship-header">
        <h1 className="page-title">Notifiche</h1>
        <p className="page-subtitle">Resta aggiornato sull&apos;attività dei tuoi amici</p>
      </div>

      <div className="friendship-card">
        <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 className="card-title">Le tue notifiche</h2>
            <p className="card-subtitle">
              {unreadCount} {unreadCount === 1 ? "non letta" : "non lette"}
            </p>
          </div>
          <button
            onClick={markAllRead}
            className="btn btn-outline btn-refresh"
            disabled={loading || unreadCount === 0}
          >
            Segna tutte come lette
          </button>
        </div>

        <div className="card-content">
          {loading && notifications.length === 0 ? (
            <div className="loading-state" style={{ minHeight: 120 }}>
              <div className="loading-spinner" />
              <p className="loading-text">Caricamento…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 120, background: "var(--cream)", border: "none", boxShadow: "none" }}>
              <div className="empty-title" style={{ fontSize: "1.1rem" }}>Nessuna notifica</div>
              <p className="empty-message" style={{ fontSize: "0.9rem" }}>Non hai notifiche al momento.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((n) => {
                const { text, detail } = describeNotification(n);
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`notification-item${n.read ? "" : " unread"}`}
                    onClick={() => open(n)}
                  >
                    {!n.read && <span className="notification-dot" aria-hidden="true" />}
                    <div className="notification-body">
                      <span className="notification-text">{text}</span>
                      {detail && <span className="notification-detail">{detail}</span>}
                      <span className="notification-date">
                        {new Date(n.createdAt).toLocaleString("it-IT")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
