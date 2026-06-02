import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile, getSpecificUserProfile } from "../services/UserService";
import {
  sendFriendshipRequest,
  respondFriendshipRequest,
  removeFriendship,
  getFriendshipStatus,
} from "../services/FriendshipService";
import { getCurrentUser } from "../services/CommonService";
import "../styles/settings.css";

const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : "?");

const BANNER_COLORS = ["var(--coral)", "var(--violet)", "var(--sky)", "var(--butter)", "var(--mint)"];

export default function ProfilePage() {
  // il parametro route è lo username (profilo pubblico)
  const { userId: usernameParam } = useParams();
  const navigate = useNavigate();
  const me = getCurrentUser();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  // friendship: { status: 'none'|'pending_sent'|'pending_received'|'accepted'|'self', friendshipId? }
  const [friendship, setFriendship] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg]   = useState("");

  const isSelf = !usernameParam || (me && usernameParam === me.username);

  const refreshFriendship = useCallback(async (username) => {
    if (isSelf || !username) return;
    const status = await getFriendshipStatus(username);
    if (status && status.status) setFriendship(status);
  }, [isSelf]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = isSelf
          ? await getUserProfile()
          : await getSpecificUserProfile(usernameParam);
        setProfile(data);
        setError(null);
        if (!isSelf) await refreshFriendship(data.username);
      } catch {
        setError("Errore nel recupero del profilo.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameParam]);

  const runAction = async (fn, successMsg) => {
    setActionBusy(true);
    setActionMsg("");
    try {
      const res = await fn();
      if (res?.success === false) {
        setActionMsg(res.message || "Operazione fallita");
      } else {
        setActionMsg(successMsg);
        try { await refreshFriendship(profile.username); } catch { /* ignora refresh */ }
      }
    } catch (err) {
      console.error("Errore azione amicizia:", err);
      setActionMsg(err?.message || "Errore di connessione al server");
    } finally {
      setActionBusy(false);
    }
  };

  const sendRequest = () => runAction(
    () => sendFriendshipRequest(profile.username),
    "Richiesta inviata"
  );
  const acceptRequest = () => runAction(
    () => respondFriendshipRequest(friendship.friendshipId, "accept"),
    "Richiesta accettata"
  );
  const rejectRequest = () => runAction(
    () => respondFriendshipRequest(friendship.friendshipId, "reject"),
    "Richiesta rifiutata"
  );
  const removeFriend = () => runAction(
    () => removeFriendship(profile.username),
    "Amicizia rimossa"
  );

  if (loading) {
    return (
      <div className="user-settings-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="user-settings-container">
        <div className="empty-state">
          <div className="empty-title">{error || "Profilo non trovato"}</div>
        </div>
      </div>
    );
  }

  const creatorId = profile.id || profile.userId;
  const bannerColor = BANNER_COLORS[(profile.username?.charCodeAt(0) ?? 0) % BANNER_COLORS.length];

  const renderFriendshipActions = () => {
    if (isSelf) return null;
    if (!friendship) return null;

    switch (friendship.status) {
      case "accepted":
        return (
          <button className="btn btn-action btn-outline" onClick={removeFriend} disabled={actionBusy}>
            Rimuovi amicizia
          </button>
        );
      case "pending_sent":
        return (
          <button className="btn btn-action btn-secondary" disabled>
            Richiesta inviata
          </button>
        );
      case "pending_received":
        return (
          <>
            <button className="btn btn-action btn-primary" onClick={acceptRequest} disabled={actionBusy}>
              Accetta richiesta
            </button>
            <button className="btn btn-action btn-outline" onClick={rejectRequest} disabled={actionBusy}>
              Rifiuta
            </button>
          </>
        );
      case "none":
      default:
        return (
          <button className="btn btn-action btn-primary" onClick={sendRequest} disabled={actionBusy}>
            Aggiungi amico
          </button>
        );
    }
  };

  return (
    <div className="user-settings-container">
      <div className="settings-content">
        <div className="profile-card">
          <div className="profile-header" style={{
            background: bannerColor,
            backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,.1) 0 16px, transparent 16px 34px)",
          }}>
            <div className="profile-avatar">
              <span className="avatar-text">{getInitials(profile.username)}</span>
            </div>
            <div className="profile-info">
              <h2 className="profile-title">{profile.username}</h2>
              <p className="profile-subtitle">{isSelf ? "Il tuo profilo" : "Profilo pubblico"}</p>
            </div>
          </div>

          {profile.bio && (
            <div style={{ padding: "16px 22px", borderBottom: "1.5px solid rgba(26,23,38,.12)" }}>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{profile.bio}</div>
            </div>
          )}

          {isSelf && profile.email && (
            <div style={{ padding: "16px 22px", borderBottom: "1.5px solid rgba(26,23,38,.12)" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 4 }}>
                Email
              </div>
              <div style={{ fontWeight: 700, wordBreak: "break-all", color: "var(--ink)" }}>{profile.email}</div>
            </div>
          )}

          <div className="profile-content">
            <div className="actions-card">
              <h2 className="actions-title">Azioni profilo</h2>
              <div className="actions-grid">
                <button className="btn btn-primary btn-action" onClick={() => navigate(`/users/${creatorId}/quizzes`)}>
                  Vedi Quiz
                </button>

                {isSelf ? (
                  <button className="btn btn-action btn-secondary" onClick={() => navigate("/settings")}>
                    Impostazioni account
                  </button>
                ) : renderFriendshipActions()}
              </div>

              {actionMsg && (
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--ink-soft)" }}>
                  {actionMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
