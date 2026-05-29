import { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "../services/UserService";
import { getAuthToken } from "../services/CommonService";
import "../styles/settings.css";

const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : "?");

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [bio, setBio]         = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile(getAuthToken());
      setProfile(data);
      setBio(data.bio || "");
      setAvatarUrl(data.avatarUrl || "");
    } catch {
      setMessage("Errore nel caricamento del profilo");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateUserProfile(getAuthToken(), { bio, avatarUrl });
      setProfile(updated);
      setMessage("Profilo aggiornato");
      setMessageType("success");
    } catch {
      setMessage("Errore nel salvataggio");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => { setMessage(""); setMessageType(""); }, 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  return (
    <div className="user-settings-container">
      <div className="settings-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Impostazioni Account</h1>
            <p className="page-subtitle">Gestisci le informazioni del tuo profilo</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert ${messageType === "success" ? "alert-success" : "alert-error"}`}>
          <div className="alert-content"><span className="alert-text">{message}</span></div>
        </div>
      )}

      {loading && !profile ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento...</p>
        </div>
      ) : profile ? (
        <div className="settings-content">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <span className="avatar-text">{getInitials(profile.username)}</span>
              </div>
              <div className="profile-info">
                <h2 className="profile-title">{profile.username}</h2>
                <p className="profile-subtitle">{profile.email}</p>
              </div>
            </div>

            <div className="profile-content">
              <form onSubmit={save}>
                <div className="setting-item">
                  <label className="setting-label">Bio</label>
                  <textarea
                    className="form-control"
                    placeholder="Racconta qualcosa di te..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="setting-item">
                  <label className="setting-label">URL Avatar</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 12 }}>
                  {saving ? "Salvataggio..." : "Salva modifiche"}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h2 className="empty-title">Impossibile caricare le impostazioni</h2>
          <button onClick={fetchProfile} className="btn btn-primary btn-empty">Riprova</button>
        </div>
      )}
    </div>
  );
}
