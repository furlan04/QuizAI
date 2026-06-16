import { useState, useEffect, useReducer, useCallback } from "react";
import { getUserProfile, updateUserProfile } from "../services/UserService";
import { useNotice } from "../hooks/useNotice";

import "../styles/settings.css";

const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : "?");

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useReducer((s, patch) => ({ ...s, ...patch }), { bio: "", avatarUrl: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const { notice, notify, clear } = useNotice();

  const fetchProfile = useCallback(async (isActive = () => true) => {
    setLoading(true);
    try {
      const data = await getUserProfile();
      if (!isActive()) return;
      setProfile(data);
      setForm({ bio: data.bio || "", avatarUrl: data.avatarUrl || "" });
    } catch {
      if (isActive()) notify("Errore nel caricamento del profilo", "error");
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [notify]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateUserProfile({ bio: form.bio, avatarUrl: form.avatarUrl });
      setProfile(updated);
      notify("Profilo aggiornato", "success");
    } catch {
      notify("Errore nel salvataggio", "error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchProfile(() => active);
    return () => { active = false; };
  }, [fetchProfile]);
  useEffect(() => {
    if (notice.message) {
      const t = setTimeout(() => clear(), 3000);
      return () => clearTimeout(t);
    }
  }, [notice.message, clear]);

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

      {notice.message && (
        <div className={`alert ${notice.type === "success" ? "alert-success" : "alert-error"}`}>
          <div className="alert-content"><span className="alert-text">{notice.message}</span></div>
        </div>
      )}

      {loading && !profile ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento…</p>
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
                  <label className="setting-label" htmlFor="settings-bio">Bio</label>
                  <textarea
                    id="settings-bio"
                    className="form-control"
                    placeholder="Racconta qualcosa di te..."
                    value={form.bio}
                    onChange={(e) => setForm({ bio: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="setting-item">
                  <label className="setting-label" htmlFor="settings-avatar">URL Avatar</label>
                  <input
                    id="settings-avatar"
                    type="url"
                    className="form-control"
                    placeholder="https://..."
                    value={form.avatarUrl}
                    onChange={(e) => setForm({ avatarUrl: e.target.value })}
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
          <button type="button" onClick={() => fetchProfile()} className="btn btn-primary btn-empty">Riprova</button>
        </div>
      )}
    </div>
  );
}
