import { useState, useEffect } from "react";
import { getUserSettings } from "../services/UserService";
import { getAuthToken } from "../services/CommonService";
import "../styles/settings.css";

export default function SettingsPage() {
  const [userSettings, setUserSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const fetchUserSettings = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const data = await getUserSettings(token);
      setUserSettings(data);
    } catch (error) {
      console.error(error);
      setMessage("Errore nel caricamento delle impostazioni");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (email) => {
    if (!email) return "?";
    const name = email.split('@')[0];
    const parts = name.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(' ');
    const initials = (parts[0]?.[0] || '').toUpperCase() + (parts[1]?.[0] || '').toUpperCase();
    return initials || name.slice(0, 2).toUpperCase();
  };

  const formatUserId = (userId) => {
    if (!userId) return "N/A";
    return userId.substring(0, 8) + "...";
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("ID copiato negli appunti");
      setMessageType("success");
    } catch (error) {
      setMessage("Errore nella copia");
      setMessageType("error");
    }
  };

  useEffect(() => {
    fetchUserSettings();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="user-settings-container">
      <div className="settings-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Impostazioni Account</h1>
            <p className="page-subtitle">
              Visualizza e gestisci le informazioni del tuo account
            </p>
          </div>
          <button 
            onClick={fetchUserSettings}
            className="btn btn-outline btn-refresh"
            disabled={loading}
          >
            <span className="btn-icon">🔄</span>
            Aggiorna
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          <div className="alert-content">
            <span className="alert-icon">
              {messageType === 'success' ? '✅' : '❌'}
            </span>
            <span className="alert-text">{message}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !userSettings ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text">Caricamento impostazioni...</p>
        </div>
      ) : userSettings ? (
        <div className="settings-content">
          {/* User Profile Card */}
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <span className="avatar-text">
                  {getInitials(userSettings.email)}
                </span>
              </div>
              <div className="profile-info">
                <h2 className="profile-title">Il Tuo Profilo</h2>
                <p className="profile-subtitle">Informazioni del tuo account</p>
              </div>
            </div>

            <div className="profile-content">
              {/* Email Section */}
              <div className="setting-item">
                <label className="setting-label">Indirizzo Email</label>
                <div className="setting-value">
                  <div className="setting-display">
                    <span className="setting-icon">📧</span>
                    <span className="setting-text">{userSettings.email}</span>
                    <div className={`status-badge ${userSettings.isEmailConfirmed ? 'status-confirmed' : 'status-pending'}`}>
                      <span className="status-icon">
                        {userSettings.isEmailConfirmed ? '✅' : '⚠️'}
                      </span>
                      <span className="status-text">
                        {userSettings.isEmailConfirmed ? 'Confermata' : 'Non Confermata'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User ID Section */}
              <div className="setting-item">
                <label className="setting-label">ID Utente</label>
                <div className="setting-value">
                  <div className="setting-display">
                    <span className="setting-icon">🆔</span>
                    <span className="setting-text setting-id">
                      {formatUserId(userSettings.userId)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(userSettings.userId)}
                      className="btn btn-copy"
                      title="Copia ID completo"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="setting-item">
                <label className="setting-label">Stato Account</label>
                <div className="setting-value">
                  <div className="setting-display status-active">
                    <span className="setting-icon">✅</span>
                    <span className="setting-text">Account Attivo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">⚙️</div>
          <h2 className="empty-title">Impossibile caricare le impostazioni</h2>
          <p className="empty-message">
            Si è verificato un errore nel caricamento delle impostazioni.
          </p>
          <button 
            onClick={fetchUserSettings}
            className="btn btn-primary btn-empty"
          >
            <span className="btn-icon">🔄</span>
            Riprova
          </button>
        </div>
      )}
    </div>
  );
}