import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getBuddySession, chatWithBuddy, updateBuddySessionHistory } from '../services/BuddyService';

export default function BuddyChatPage() {
  const { id: sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const fetchSession = async () => {
    setLoading(true);
    setError("");
    const data = await getBuddySession(sessionId);
    if (data) {
      setSession(data);
      setHistory(data.history || []);
    } else {
      setError("Impossibile caricare la sessione.");
    }
    setLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setError("");
    setSuccess("");

    const userMessage = { role: 'user', content: message.trim() };
    const currentHistory = [...history];
    setHistory([...currentHistory, userMessage]);
    setMessage("");
    setSending(true);

    const res = await chatWithBuddy(sessionId, user?.userId, userMessage.content, currentHistory);
    
    if (res.success) {
      const newHistory = res.updated_history || [...currentHistory, userMessage, { role: 'assistant', content: res.response }];
      setHistory(newHistory);
      
      // Update session history on backend
      try {
        await updateBuddySessionHistory(sessionId, newHistory);
      } catch (err) {
        console.error("Failed to update history", err);
      }
      
      // Check if it's a quiz generation trigger
      if (res.response && res.response.toLowerCase().includes("quiz")) {
        setSuccess("Generazione quiz avviata! Controlla la tua lista quiz a breve.");
      }
    } else {
      setError(res.message || "Errore durante l'invio del messaggio.");
      // Revert optimism
      setHistory(currentHistory);
    }
    setSending(false);
  };

  if (loading) return <div className="buddy-container"><div className="loading-spinner" /></div>;
  if (!session) return <div className="buddy-container"><div className="buddy-empty-state"><p>Sessione non trovata.</p></div></div>;

  return (
    <div className="buddy-container" style={{ paddingTop: '2rem' }}>
      <div className="buddy-chat-wrapper">
        <div className="buddy-chat-header">
          <h1 className="page-title">{session.title}</h1>
        </div>

        {(error || success) && (
          <div style={{ padding: '1rem 1.5rem', background: '#fff' }}>
            {error && (
              <div className="alert alert-error">
                <div className="alert-content">
                  <span className="alert-text">{error}</span>
                </div>
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <div className="alert-content">
                  <span className="alert-text">{success}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="buddy-chat-messages">
          {history.length === 0 ? (
            <div className="buddy-empty-state" style={{ marginTop: 0, border: 'none', boxShadow: 'none' }}>
              <p>Inizia a fare domande sul documento! Prova a chiedere "Fammi un riassunto" o "Genera un quiz".</p>
            </div>
          ) : (
            history.map((msg, idx) => (
              <div key={idx} className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.content}</div>
              </div>
            ))
          )}
          {sending && (
            <div className="buddy-typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="buddy-chat-input-area">
          <form onSubmit={handleSend} className="buddy-chat-form">
            <input
              type="text"
              className="form-control"
              placeholder="Chiedi qualcosa sul documento..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className="btn btn-primary" disabled={!message.trim() || sending}>
              Invia
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
