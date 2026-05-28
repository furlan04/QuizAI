import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFriendsList, removeFriendship } from "../services/FriendshipService";
import { getAuthToken } from "../services/CommonService";

const getInitials = (email) => {
  if (!email) return "?";
  const name  = email.split("@")[0];
  const parts = name.replace(/[^a-zA-Z0-9]/g, " ").trim().split(" ");
  return ((parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase()) || name.slice(0, 2).toUpperCase();
};

const AV_COLORS = ["var(--coral)", "var(--sky)", "var(--butter)", "var(--mint)", "var(--violet)", "var(--lime)"];

export default function FriendsListPage() {
  const [friends, setFriends]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState("");
  const [messageType, setMessageType] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const navigate = useNavigate();

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const data = await getFriendsList(getAuthToken());
      setFriends(data);
    } catch {
      setMessage("Errore nel caricamento della lista amici");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = (friendshipId, friendEmail) => {
    setConfirmDialog({ friendshipId, friendEmail, message: `Rimuovere l'amicizia con ${friendEmail}?` });
  };

  const confirmRemoveFriend = async () => {
    if (!confirmDialog) return;
    setLoading(true);
    setConfirmDialog(null);
    try {
      await removeFriendship(confirmDialog.friendshipId, getAuthToken());
      setMessage("Amicizia rimossa con successo");
      setMessageType("success");
      fetchFriends();
    } catch {
      setMessage("Errore nella rimozione dell'amicizia");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFriends(); }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => { setMessage(""); setMessageType(""); }, 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  return (
    <div className="friends-list-container">
      {/* Confirm dialog */}
      {confirmDialog && (
        <div style={{
          position: "fixed", top: 20, right: 20,
          background: "#fff",
          border: "2.5px solid var(--ink)",
          borderRadius: "var(--radius)",
          padding: "22px 24px",
          boxShadow: "var(--shadow-hard-lg)",
          zIndex: 10000,
          minWidth: 320, maxWidth: 380,
        }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 12, color: "var(--ink)" }}>
            Conferma rimozione
          </div>
          <div style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5, marginBottom: 18 }}>
            {confirmDialog.message}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-outline" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => setConfirmDialog(null)}>
              Annulla
            </button>
            <button className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 13, background: "var(--coral)", color: "var(--ink)" }} onClick={confirmRemoveFriend} disabled={loading}>
              {loading ? "Rimozione..." : "Rimuovi"}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="friends-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">I miei amici</h1>
            <p className="page-subtitle">Gestisci le tue connessioni</p>
          </div>
          <button onClick={fetchFriends} className="btn btn-outline" disabled={loading}>
            Aggiorna
          </button>
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

      {/* Content */}
      {loading && friends.length === 0 ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento amici...</p>
        </div>
      ) : friends.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-title">Nessun amico ancora</h2>
          <p className="empty-message">
            Non hai ancora amici nella tua lista. Inizia inviando qualche richiesta di amicizia!
          </p>
          <a href="/friendship/requests" className="btn btn-primary btn-empty">
            Gestisci richieste
          </a>
        </div>
      ) : (
        <>
          <div className="friends-stats">
            <span className="stats-text">
              {friends.length} {friends.length === 1 ? "amico" : "amici"}
            </span>
          </div>

          <div className="friends-grid">
            {friends.map((friend, idx) => {
              const avColor = AV_COLORS[idx % AV_COLORS.length];
              return (
                <div key={friend.friendshipId || friend.id} className="friend-card">
                  {/* Colored banner */}
                  <div style={{
                    height: 56,
                    background: avColor,
                    backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,.1) 0 8px, transparent 8px 20px)",
                    borderBottom: "2.5px solid var(--ink)",
                  }} />

                  {/* Avatar + name row */}
                  <div style={{ padding: "0 20px 12px", marginTop: -26, display: "flex", alignItems: "flex-end", gap: 12 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%",
                      background: avColor, border: "3px solid #fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "3px 3px 0 0 var(--ink)", flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 18, color: "var(--ink)" }}>
                        {getInitials(friend.friendEmail)}
                      </span>
                    </div>
                    <div style={{ paddingBottom: 4, minWidth: 0, overflow: "hidden" }}>
                      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--ink)", wordBreak: "break-all", letterSpacing: "-.01em", lineHeight: 1.15 }}>
                        {friend.friendEmail}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="friend-actions">
                    <button
                      className="btn btn-primary btn-view-quizzes"
                      onClick={() => navigate(`/profile/${friend.friendId}`)}
                      disabled={loading}
                    >
                      Vedi profilo
                    </button>
                    <button
                      className="btn btn-outline btn-remove"
                      onClick={() => removeFriend(friend.friendshipId || friend.id, friend.friendEmail)}
                      disabled={loading}
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
