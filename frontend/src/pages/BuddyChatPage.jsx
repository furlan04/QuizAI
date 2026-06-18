import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getBuddySession, chatWithBuddy, updateBuddySessionHistory } from '../services/BuddyService';

export default function BuddyChatPage() {
  const { id: sessionId } = useParams();
  const { user } = useAuth();
  const [state, dispatch] = React.useReducer((s, a) => ({ ...s, ...a }), {
    session: null, history: [], message: "", loading: true, sending: false, error: "", success: ""
  });
  const { session, history, message, loading, sending, error, success } = state;
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchSession = async () => {
      dispatch({ loading: true, error: "" });
      const data = await getBuddySession(sessionId);
      if (data) {
        const historyWithIds = (data.history || []).map(m => ({ ...m, id: m.id || crypto.randomUUID() }));
        dispatch({ session: data, history: historyWithIds, loading: false });
      } else {
        dispatch({ error: "Impossibile caricare la sessione.", loading: false });
      }
    };
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    dispatch({ error: "", success: "" });

    const userMessage = { id: crypto.randomUUID(), role: 'user', content: message.trim() };
    const currentHistory = [...history];
    const newOptimisticHistory = [...currentHistory, userMessage];
    dispatch({ history: newOptimisticHistory, message: "", sending: true });

    try {
      const chatTitle = session?.title || "Quiz";
      const userName = user?.username || "Utente";
      const res = await chatWithBuddy(sessionId, user?.userId, userMessage.content, currentHistory, chatTitle, userName);
      
      if (res.success) {
        const finalHistory = res.updated_history 
          ? res.updated_history.map(m => ({ ...m, id: m.id || crypto.randomUUID() })) 
          : [...newOptimisticHistory, { id: crypto.randomUUID(), role: 'assistant', content: res.response }];
        dispatch({ history: finalHistory });
        
        // Update session history on backend
        try {
          await updateBuddySessionHistory(sessionId, finalHistory);
        } catch (err) {
          console.error("Failed to update history", err);
        }
        
        // Check if it's a quiz generation trigger
        if (res.response && res.response.toLowerCase().includes("quiz")) {
          dispatch({ success: "Generazione quiz avviata! Controlla la tua lista quiz a breve." });
        }
      } else {
        dispatch({ error: res.message || "Errore durante l'invio del messaggio.", history: currentHistory });
      }
    } catch (err) {
      console.error("Error during chatWithBuddy", err);
      dispatch({ error: "Si è verificato un errore imprevisto.", history: currentHistory });
    } finally {
      dispatch({ sending: false });
    }
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
            history.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}>
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
              aria-label="Chiedi qualcosa sul documento..."
              value={message}
              onChange={(e) => dispatch({ message: e.target.value })}
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
