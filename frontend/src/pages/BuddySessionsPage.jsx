import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBuddySessions, deleteBuddySession, uploadBuddyDocument, createBuddySession } from '../services/BuddyService';

export default function BuddySessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const data = await getBuddySessions();
    setSessions(data || []);
    setLoading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    
    // 1. Upload to file-service
    const uploadRes = await uploadBuddyDocument(file);
    if (!uploadRes.success) {
      alert(uploadRes.message);
      setUploading(false);
      return;
    }

    // 2. Create session in user-service
    const { session_id, title } = uploadRes;
    const createRes = await createBuddySession(session_id, title);
    
    setUploading(false);
    if (!createRes.success) {
      alert(createRes.message);
      return;
    }

    setShowModal(false);
    navigate(`/buddy/${session_id}`);
  };

  const handleDelete = async (e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Sei sicuro di voler eliminare questa sessione?")) return;
    
    const success = await deleteBuddySession(sessionId);
    if (success) {
      setSessions(sessions.filter(s => s.id !== sessionId && s._id !== sessionId));
    } else {
      alert("Errore durante l'eliminazione della sessione");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Buddy Chat</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Nuovo Buddy
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <p>Non hai ancora nessuna sessione Buddy.</p>
          <button className="btn btn-primary mt-3" onClick={() => setShowModal(true)}>Carica un documento</button>
        </div>
      ) : (
        <div className="card-grid">
          {sessions.map(session => (
            <div key={session.id || session._id} className="quiz-card" onClick={() => navigate(`/buddy/${session.id || session._id}`)}>
              <div className="quiz-card-header">
                <h3>{session.title}</h3>
                <button className="btn-icon text-danger" onClick={(e) => handleDelete(e, session.id || session._id)}>
                  Elimina
                </button>
              </div>
              <p className="text-muted text-sm mt-2">
                Ultimo messaggio: {new Date(session.lastMessageAt || session.last_message_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Nuovo Buddy</h2>
            <p>Carica un documento (PDF, DOCX) per iniziare a studiare con l'AI.</p>
            <form onSubmit={handleUpload}>
              <div className="form-group mt-3">
                <input type="file" accept=".pdf,.docx" onChange={handleFileChange} required />
              </div>
              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={uploading}>Annulla</button>
                <button type="submit" className="btn btn-primary" disabled={!file || uploading}>
                  {uploading ? 'Caricamento...' : 'Inizia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
