import { useEffect, useState } from "react";
import { getUserProfile, getSpecificUserProfile } from "../services/UserService";
import { sendFriendshipRequest, removeFriendship } from "../services/FriendshipService";
import { useParams, useNavigate } from "react-router-dom";
import { getAuthToken } from "../services/CommonService";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/settings.css";

const getInitials = (email) => {
  if (!email) return "?";
  const name  = email.split("@")[0];
  const parts = name.replace(/[^a-zA-Z0-9]/g, " ").trim().split(" ");
  return ((parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase()) || name.slice(0, 2).toUpperCase();
};

const BANNER_COLORS = [
  "var(--coral)",
  "var(--violet)",
  "var(--sky)",
  "var(--butter)",
  "var(--mint)",
];

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const navigate              = useNavigate();
  const { userId }            = useParams();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = userId
          ? await getSpecificUserProfile(getAuthToken(), userId)
          : await getUserProfile(getAuthToken());
        setProfile(data);
        setError(null);
      } catch {
        setError("Errore nel recupero del profilo.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

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

  if (error) {
    return (
      <div className="user-settings-container">
        <div className="error-state">
          <div className="error-title">{error}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="user-settings-container">
        <div className="empty-state">
          <div className="empty-title">Nessun profilo trovato</div>
          <p className="empty-message">Il profilo richiesto non esiste o non può essere visualizzato.</p>
        </div>
      </div>
    );
  }

  /* Pick a stable banner colour from the email hash */
  const bannerColor = BANNER_COLORS[(profile.email?.charCodeAt(0) ?? 0) % BANNER_COLORS.length];

  return (
    <div className="user-settings-container">
      <div className="settings-content">
        <div className="profile-card">
          {/* Banner */}
          <div
            className="profile-header"
            style={{
              background: bannerColor,
              backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,.1) 0 16px, transparent 16px 34px)",
            }}
          >
            <div className="profile-avatar">
              <span className="avatar-text">{getInitials(profile.email)}</span>
            </div>
            <div className="profile-info">
              <h2 className="profile-title">
                {userId ? profile.email : "Il tuo profilo"}
              </h2>
              <p className="profile-subtitle">
                {userId ? `Account di ${profile.email}` : "Informazioni account"}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1.5px solid rgba(26,23,38,.12)",
          }}>
            <div style={{ padding: "16px 22px", borderRight: "1.5px solid rgba(26,23,38,.12)" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 4 }}>
                Email
              </div>
              <div style={{ fontWeight: 700, wordBreak: "break-all", fontSize: 14, color: "var(--ink)" }}>
                {profile.email}
              </div>
            </div>
            <div style={{ padding: "16px 22px" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 4 }}>
                Amici
              </div>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 28, lineHeight: 1, letterSpacing: "-.02em", color: "var(--ink)" }}>
                {profile.friendsCount ?? 0}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="profile-content">
            <div className="actions-card">
              <h2 className="actions-title">Azioni profilo</h2>
              <div className="actions-grid">
                <button
                  className="btn btn-primary btn-action"
                  onClick={() => navigate(`/quizzes/${profile.userId}`)}
                >
                  Vedi Quiz
                </button>

                {!profile.isCurrentUser && !profile.haveSentRequest && (
                  <AnimatePresence mode="wait">
                    <motion.button
                      key={profile.isFriend ? "remove" : "add"}
                      className={`btn btn-action ${profile.isFriend ? "btn-outline" : "btn-primary"}`}
                      onClick={async () => {
                        try {
                          if (profile.isFriend) {
                            await removeFriendship(profile.friendshipId, getAuthToken());
                            setProfile({ ...profile, isFriend: false, haveSentRequest: false });
                          } else {
                            await sendFriendshipRequest(profile.email, getAuthToken());
                            setProfile({ ...profile, isFriend: true, haveSentRequest: true });
                          }
                        } catch (err) {
                          console.error("Errore aggiornamento amicizia", err);
                        }
                      }}
                      initial={{ opacity: 0, scale: .85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: .85 }}
                      transition={{ duration: .25 }}
                    >
                      {profile.isFriend ? "Rimuovi amicizia" : "Aggiungi amicizia"}
                    </motion.button>
                  </AnimatePresence>
                )}

                {profile.haveSentRequest && !profile.isCurrentUser && (
                  <button className="btn btn-action btn-secondary" disabled>
                    Richiesta inviata
                  </button>
                )}

                {profile.isCurrentUser && (
                  <button
                    className="btn btn-action btn-secondary"
                    onClick={() => navigate("/settings")}
                  >
                    Impostazioni account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
