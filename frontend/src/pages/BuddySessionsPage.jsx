import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBuddySessions, deleteBuddySession, uploadBuddyDocument, createBuddySession } from '../services/BuddyService';

export default function BuddySessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [error, setError] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError("");
    const data = await getBuddySessions();
    setSessions(data || []);
    setLoading(false);
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      await processUpload(selectedFile);
    }
    // Reset the input value so the same file can be selected again if it fails
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processUpload = async (fileToUpload) => {
    setUploading(true);
    setError("");
    
    // 1. Upload to file-service
    const uploadRes = await uploadBuddyDocument(fileToUpload);
    if (!uploadRes.success) {
      setError(uploadRes.message || "Errore durante il caricamento del documento.");
      setUploading(false);
      return;
    }

    // 2. Create session in user-service
    const { session_id, title } = uploadRes;
    const createRes = await createBuddySession(session_id, title);
    
    setUploading(false);
    if (!createRes.success) {
      setError(createRes.message || "Errore durante la creazione della sessione.");
      return;
    }

    navigate(`/buddy/${session_id}`);
  };

  const handleNewBuddyClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDelete = async (e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Sei sicuro di voler eliminare questa sessione?")) return;
    
    setError("");
    const success = await deleteBuddySession(sessionId);
    if (success) {
      setSessions(sessions.filter(s => s.id !== sessionId && s._id !== sessionId));
    } else {
      setError("Errore durante l'eliminazione della sessione");
    }
  };

  return (
    <div className="buddy-container">
      <div className="page-header">
        <h1 className="page-title">Buddy Chat</h1>
        <button type="button" className="btn btn-primary" onClick={handleNewBuddyClick} disabled={uploading}>
          {uploading ? 'Caricamento...' : 'Nuovo Buddy'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <div className="alert-content">
            <span className="alert-text">{error}</span>
          </div>
        </div>
      )}

      {/* Hidden file input for direct opening of file explorer */}
      <input 
        type="file" 
        accept=".pdf,.docx" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        aria-label="Carica un documento"
      />

      {loading ? (
        <div className="loading-spinner" />
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <p>Non hai ancora nessuna sessione Buddy.</p>
          <button type="button" className="btn btn-primary mt-3" onClick={handleNewBuddyClick} disabled={uploading}>
            {uploading ? 'Caricamento in corso...' : 'Carica un documento'}
          </button>
        </div>
      ) : (
        <div className="quiz-grid" style={{ marginTop: '30px' }}>
          {sessions.map((session, index) => {
            const coverClass = `quiz-cover-${index % 6}`;
            return (
              <div 
                key={session.id || session._id} 
                className="quiz-card" 
                onClick={() => navigate(`/buddy/${session.id || session._id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/buddy/${session.id || session._id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={`quiz-card-header ${coverClass}`}>
                  <div className="quiz-ai-badge">Buddy Session</div>
                </div>
                <div className="quiz-card-content">
                  <h3 className="quiz-title">{session.title || "Documento senza titolo"}</h3>
                  <p className="quiz-description">
                    Ultimo aggiornamento: {new Date(session.lastMessageAt || session.last_message_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="quiz-card-actions">
                  <button type="button" className="btn btn-play" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/buddy/${session.id || session._id}`);
                  }}>
                    Apri Chat
                  </button>
                  <button type="button" className="btn btn-primary-outline" onClick={(e) => handleDelete(e, session.id || session._id)} style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}>
                    Elimina Sessione
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
