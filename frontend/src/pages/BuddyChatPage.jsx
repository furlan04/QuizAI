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

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const fetchSession = async () => {
    setLoading(true);
    const data = await getBuddySession(sessionId);
    if (data) {
      setSession(data);
      setHistory(data.history || []);
    }
    setLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const userMessage = { role: 'user', content: message.trim() };
    const currentHistory = [...history];
    setHistory([...currentHistory, userMessage]);
    setMessage("");
    setSending(true);

    const res = await chatWithBuddy(sessionId, user?.id, userMessage.content, currentHistory);
    
    if (res.success) {
      const newHistory = res.updated_history || [...currentHistory, userMessage, { role: 'assistant', content: res.response }];
      setHistory(newHistory);
      
      // Update session history on backend
      await updateBuddySessionHistory(sessionId, newHistory);
      
      // Check if it's a quiz generation trigger
      if (res.response && res.response.toLowerCase().includes("quiz")) {
        // Mostra un toast notification (implementazione basica)
        alert("Generazione quiz avviata! Controlla la tua lista quiz a breve.");
      }
    } else {
      alert(res.message);
      // Revert optimism
      setHistory(currentHistory);
    }
    setSending(false);
  };

  if (loading) return <div className="page-container"><div className="loading-spinner" /></div>;
  if (!session) return <div className="page-container"><div className="empty-state"><p>Sessione non trovata.</p></div></div>;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 className="page-title">{session.title}</h1>
      </div>

      <div className="chat-container" style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {history.length === 0 ? (
          <div className="empty-state text-muted text-center mt-5">
            Inizia a fare domande sul documento! Prova a chiedere "Fammi un riassunto" o "Genera un quiz".
          </div>
        ) : (
          history.map((msg, idx) => (
            <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%', padding: '12px 16px', borderRadius: '12px', backgroundColor: msg.role === 'user' ? '#3b82f6' : '#f1f5f9', color: msg.role === 'user' ? '#fff' : '#0f172a' }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.content}</div>
            </div>
          ))
        )}
        {sending && (
          <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
            Buddy sta scrivendo...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Chiedi qualcosa sul documento..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={!message.trim() || sending}>
          Invia
        </button>
      </form>
    </div>
  );
}
