import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFriendsList, removeFriendship } from "../services/FriendshipService";
import { useNotice } from "../hooks/useNotice";


const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : "?");

const AV_COLORS = ["var(--coral)", "var(--sky)", "var(--butter)", "var(--mint)", "var(--violet)", "var(--lime)"];

export default function FriendsListPage() {
  const [friends, setFriends]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const { notice, notify, clear }     = useNotice();
  const [confirmDialog, setConfirmDialog] = useState(null);
  const navigate = useNavigate();

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const data = await getFriendsList();
      setFriends(Array.isArray(data) ? data : []);
    } catch {
      notify("Errore nel caricamento della lista amici", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmRemoveFriend = async () => {
    if (!confirmDialog) return;
    const { username } = confirmDialog;
    setConfirmDialog(null);
    setLoading(true);
    try {
      await removeFriendship(username);
      notify("Amicizia rimossa con successo", "success");
      fetchFriends();
    } catch {
      notify("Errore nella rimozione dell'amicizia", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFriends(); }, []);
  useEffect(() => {
    if (notice.message) {
      const t = setTimeout(() => clear(), 3000);
      return () => clearTimeout(t);
    }
  }, [notice.message, clear]);

  return (
    <div className="friends-list-container">
      {confirmDialog && (
        <div style={{
          position: "fixed", top: 20, right: 20, background: "#fff",
          border: "2.5px solid var(--ink)", borderRadius: "var(--radius)",
          padding: "22px 24px", boxShadow: "var(--shadow-hard-lg)", zIndex: 10000, minWidth: 320, maxWidth: 380,
        }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
            Conferma rimozione
          </div>
          <div style={{ color: "var(--ink-soft)", fontSize: 14, marginBottom: 18 }}>
            Rimuovere l&apos;amicizia con {confirmDialog.username}?
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-outline" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => setConfirmDialog(null)}>Annulla</button>
            <button className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 13, background: "var(--coral)", color: "var(--ink)" }} onClick={confirmRemoveFriend} disabled={loading}>
              {loading ? "Rimozione..." : "Rimuovi"}
            </button>
          </div>
        </div>
      )}

      <div className="friends-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">I miei amici</h1>
            <p className="page-subtitle">Gestisci le tue connessioni</p>
          </div>
          <button onClick={fetchFriends} className="btn btn-outline" disabled={loading}>Aggiorna</button>
        </div>
      </div>

      {notice.message && (
        <div className={`alert ${notice.type === "success" ? "alert-success" : "alert-error"}`}>
          <div className="alert-content"><span className="alert-text">{notice.message}</span></div>
        </div>
      )}

      {loading && friends.length === 0 ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento amici…</p>
        </div>
      ) : friends.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-title">Nessun amico ancora</h2>
          <p className="empty-message">Inizia inviando qualche richiesta di amicizia!</p>
          <a href="/friendship/requests" className="btn btn-primary btn-empty">Gestisci richieste</a>
        </div>
      ) : (
        <>
          <div className="friends-stats">
            <span className="stats-text">{friends.length} {friends.length === 1 ? "amico" : "amici"}</span>
          </div>

          <div className="friends-grid">
            {friends.map((friend, idx) => {
              const avColor = AV_COLORS[idx % AV_COLORS.length];
              return (
                <div key={friend.userId} className="friend-card">
                  <div style={{
                    height: 56, background: avColor,
                    backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,.1) 0 8px, transparent 8px 20px)",
                    borderBottom: "2.5px solid var(--ink)",
                  }} />
                  <div style={{ padding: "0 20px 12px", marginTop: -26, display: "flex", alignItems: "flex-end", gap: 12 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%", background: avColor, border: "3px solid #fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "3px 3px 0 0 var(--ink)", flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 18 }}>
                        {getInitials(friend.username)}
                      </span>
                    </div>
                    <div style={{ paddingBottom: 4, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15, lineHeight: 1.15 }}>
                        {friend.username}
                      </div>
                      {friend.bio && <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{friend.bio}</div>}
                    </div>
                  </div>
                  <div className="friend-actions">
                    <button className="btn btn-primary btn-view-quizzes" onClick={() => navigate(`/profile/${friend.username}`)} disabled={loading}>
                      Vedi profilo
                    </button>
                    <button className="btn btn-outline btn-remove" onClick={() => setConfirmDialog({ username: friend.username })} disabled={loading}>
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
