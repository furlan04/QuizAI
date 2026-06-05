import { useState, useEffect } from "react";
import { getFriendshipRequests, sendFriendshipRequest, respondFriendshipRequest } from "../services/FriendshipService";
import { useNotice } from "../hooks/useNotice";


export default function FriendshipRequestsPage() {
  const [username, setUsername]   = useState("");
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const { notice, notify, clear } = useNotice();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getFriendshipRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      notify("Errore nel caricamento delle richieste", "error");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    const res = await sendFriendshipRequest(username.trim());
    setLoading(false);
    if (res.success) {
      notify("Richiesta di amicizia inviata!", "success");
      setUsername("");
    } else {
      notify(res.message || "Errore nell'invio della richiesta", "error");
    }
  };

  const respond = async (friendshipId, action) => {
    setLoading(true);
    const res = await respondFriendshipRequest(friendshipId, action);
    setLoading(false);
    if (res.success) {
      notify(action === "accept" ? "Richiesta accettata!" : "Richiesta rifiutata", "success");
      fetchRequests();
    } else {
      notify(res.message || "Errore nella risposta", "error");
    }
  };

  useEffect(() => { fetchRequests(); }, []);
  useEffect(() => {
    if (notice.message) {
      const t = setTimeout(() => clear(), 3000);
      return () => clearTimeout(t);
    }
  }, [notice.message, clear]);

  return (
    <div className="friendship-requests-container">
      <div className="friendship-header">
        <h1 className="page-title">Richieste di amicizia</h1>
        <p className="page-subtitle">Invia e gestisci le richieste di amicizia</p>
      </div>

      <div className="friendship-grid">
        {/* Invia richiesta */}
        <div className="friendship-card send-request-card">
          <div className="card-header">
            <h2 className="card-title">Invia richiesta</h2>
            <p className="card-subtitle">Aggiungi un nuovo amico tramite username</p>
          </div>
          <div className="card-content">
            <form onSubmit={sendRequest} className="request-form">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Username dell&apos;utente</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="es. mario_rossi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="form-hint">Inserisci lo username esatto dell&apos;utente</p>
              </div>
              <button type="submit" className="btn btn-primary btn-send-request" disabled={loading}>
                {loading ? "Invio..." : "Invia richiesta"}
              </button>
            </form>
          </div>
        </div>

        {/* Richieste in arrivo */}
        <div className="friendship-card incoming-requests-card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 className="card-title">Richieste in arrivo</h2>
              <p className="card-subtitle">
                {requests.length} {requests.length === 1 ? "richiesta" : "richieste"} in attesa
              </p>
            </div>
            <button onClick={fetchRequests} className="btn btn-outline btn-refresh" disabled={loading}>Aggiorna</button>
          </div>

          <div className="card-content">
            {loading && requests.length === 0 ? (
              <div className="loading-state" style={{ minHeight: 120 }}>
                <div className="loading-spinner" />
                <p className="loading-text">Caricamento…</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 120, background: "var(--cream)", border: "none", boxShadow: "none" }}>
                <div className="empty-title" style={{ fontSize: "1.1rem" }}>Nessuna richiesta</div>
                <p className="empty-message" style={{ fontSize: "0.9rem" }}>Non hai richieste in arrivo al momento.</p>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map((req) => (
                  <div key={req.friendshipId} className="request-item">
                    <div className="request-avatar">
                      <span className="avatar-text" style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff" }}>
                        {(req.username || "?").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="request-info">
                      <h4 className="request-email">{req.username}</h4>
                      {req.createdAt && (
                        <p className="request-date">{new Date(req.createdAt).toLocaleDateString("it-IT")}</p>
                      )}
                    </div>
                    <div className="request-actions" style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-accept" onClick={() => respond(req.friendshipId, "accept")} disabled={loading}>
                        Accetta
                      </button>
                      <button className="btn btn-outline" onClick={() => respond(req.friendshipId, "reject")} disabled={loading}>
                        Rifiuta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {notice.message && (
        <div className={`alert ${notice.type === "success" ? "alert-success" : "alert-error"}`}>
          <div className="alert-content"><span className="alert-text">{notice.message}</span></div>
        </div>
      )}
    </div>
  );
}
