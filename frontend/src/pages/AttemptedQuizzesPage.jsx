import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserSettings } from "../services/UserService";


export default function AttemptedQuizPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const profile = await getUserSettings(); // quiz-service /users/me
        setAttempts(profile?.attempts || []);
      } catch {
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento quiz provati...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Quiz che hai provato</h1>
            <p className="page-subtitle">Apri un quiz per vederne il dettaglio</p>
          </div>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Nessun quiz provato</div>
          <p className="empty-message">Gioca il tuo primo quiz per vederlo qui.</p>
          <Link to="/quizzes" className="btn btn-primary btn-empty">Esplora quiz</Link>
        </div>
      ) : (
        <div className="quiz-grid">
          {attempts.map((a) => (
            <article key={a.quizId} className="quiz-card">
              <Link
                to={`/quizzes/${a.quizId}`}
                className="quiz-card-header quiz-cover-2"
                style={{ textDecoration: "none", display: "block" }}
              >
                <span className="quiz-ai-badge">{a.score} pt</span>
              </Link>

              <div className="quiz-card-content">
                <Link to={`/quizzes/${a.quizId}`} style={{ textDecoration: "none", color: "var(--ink)" }}>
                  <h3 className="quiz-title">{a.quizTitle || "Quiz"}</h3>
                </Link>
                <p className="quiz-description">Completato il {formatDate(a.completedAt)}</p>
              </div>

              <div className="quiz-card-actions">
                <Link to={`/quizzes/${a.quizId}`} className="btn btn-primary btn-play">
                  Apri quiz
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
