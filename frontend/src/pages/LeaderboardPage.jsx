import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getLeaderboard } from "../services/QuizAttemptService";
import { getCurrentUser } from "../services/CommonService";

const positionIcon = (pos) => `#${pos}`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { quizId } = useParams();
  const me = getCurrentUser();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLeaderboard(quizId);
        setEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (quizId) fetchLeaderboard();
  }, [quizId]);

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento classifica…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-list-container">
        <div className="error-state">
          <div className="error-title">Errore nel caricamento</div>
          <p>{error}</p>
          <Link to="/quizzes" className="btn btn-primary" style={{ marginTop: 16 }}>Torna ai Quiz</Link>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="quiz-list-container">
        <div className="empty-state">
          <div className="empty-title">Nessuna classifica disponibile</div>
          <p className="empty-message">Questo quiz non ha ancora tentativi completati.</p>
          <Link to={`/quiz/${quizId}`} className="btn btn-primary btn-empty">Gioca ora</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Classifica</h1>
            <p className="page-subtitle">{entries.length} partecipanti</p>
          </div>
          <Link to="/quizzes" className="btn btn-outline">Torna ai Quiz</Link>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((entry, index) => {
          const isMe = me && entry.username === me.username;
          return (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr auto auto",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: isMe ? "var(--lime,#e8ff8a)" : "#fff",
                border: "2px solid var(--ink)",
                borderRadius: "var(--radius-sm,10px)",
                boxShadow: "3px 3px 0 0 var(--ink)",
              }}
            >
              <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 18 }}>
                {positionIcon(index + 1)}
              </span>
              <span style={{ fontWeight: 700 }}>
                {entry.username} {isMe && <small>(tu)</small>}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 18 }}>
                {entry.score}
              </span>
              <span style={{ fontSize: 12, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
                {formatDate(entry.completedAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
