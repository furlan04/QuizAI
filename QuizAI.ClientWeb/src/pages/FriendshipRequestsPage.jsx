import { useState, useEffect } from "react";
import { getFriendshipRequests, sendFriendshipRequest, acceptFriendshipRequest } from "../services/FriendshipService";
import { getAuthToken } from "../services/CommonService";

export default function FriendshipRequestsPage() {
  const [email, setEmail]         = useState("");
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState("");
  const [messageType, setMessageType] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getFriendshipRequests(getAuthToken());
      setRequests(data);
    } catch {
      setMessage("Errore nel caricamento delle richieste");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await sendFriendshipRequest(email, getAuthToken());
      setMessage("Richiesta di amicizia inviata con successo!");
      setMessageType("success");
      setEmail("");
    } catch (error) {
      setMessage(error.message || "Errore nell'invio della richiesta");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (friendshipId) => {
    setLoading(true);
    try {
      await acceptFriendshipRequest(friendshipId, getAuthToken());
      setMessage("Richiesta di amicizia accettata!");
      setMessageType("success");
      fetchRequests();
    } catch {
      setMessage("Errore nell'accettare la richiesta");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => { setMessage(""); setMessageType(""); }, 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  return (
    <div className="friendship-requests-container">
      {/* Header */}
      <div className="friendship-header">
        <h1 className="page-title">Richieste di amicizia</h1>
        <p className="page-subtitle">Invia e gestisci le richieste di amicizia</p>
      </div>

      <div className="friendship-grid">
        {/* Send request card */}
        <div className="friendship-card send-request-card">
          <div className="card-header">
            <h2 className="card-title">Invia richiesta</h2>
            <p className="card-subtitle">Aggiungi un nuovo amico alla tua rete</p>
          </div>

          <div className="card-content">
            <form onSubmit={sendRequest} className="request-form">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email dell&apos;utente</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="form-hint">
                  Inserisci l&apos;email esatta dell&apos;utente
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-send-request"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2.5, borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} />
                    Invio...
                  </>
                ) : (
                  "Invia richiesta"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Incoming requests card */}
        <div className="friendship-card incoming-requests-card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 className="card-title">Richieste in arrivo</h2>
              <p className="card-subtitle">
                {requests.length} {requests.length === 1 ? "richiesta" : "richieste"} in attesa
              </p>
            </div>
            <button onClick={fetchRequests} className="btn btn-outline btn-refresh" disabled={loading}>
              Aggiorna
            </button>
          </div>

          <div className="card-content">
            {loading && requests.length === 0 ? (
              <div className="loading-state" style={{ minHeight: 120 }}>
                <div className="loading-spinner" />
                <p className="loading-text">Caricamento...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 120, background: "var(--cream)", border: "none", boxShadow: "none" }}>
                <div className="empty-title" style={{ fontSize: "1.1rem" }}>Nessuna richiesta</div>
                <p className="empty-message" style={{ fontSize: "0.9rem" }}>
                  Non hai richieste di amicizia in arrivo al momento.
                </p>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map((request) => (
                  <div key={request.id} className="request-item">
                    <div className="request-avatar">
                      <span className="avatar-text" style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff" }}>
                        {(request.email || "?").slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    <div className="request-info">
                      <h4 className="request-email">{request.email}</h4>
                      {request.sentAt && (
                        <p className="request-date">
                          {new Date(request.sentAt).toLocaleDateString("it-IT")}
                        </p>
                      )}
                    </div>

                    <div className="request-actions">
                      <button
                        className="btn btn-accept"
                        onClick={() => acceptRequest(request.id)}
                        disabled={loading}
                      >
                        Accetta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback alert */}
      {message && (
        <div className={`alert ${messageType === "success" ? "alert-success" : "alert-error"}`}>
          <div className="alert-content">
            <span className="alert-text">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
