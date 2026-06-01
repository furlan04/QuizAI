import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserSettings } from "../services/UserService";
import { getAuthToken } from "../services/CommonService";

export default function AttemptedQuizPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const profile = await getUserSettings(getAuthToken()); // quiz-service /users/me
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
            <p className="page-subtitle">Rivedi i tuoi tentativi e rigioca</p>
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
              <div className="quiz-card-header quiz-cover-2">
                <span className="quiz-ai-badge">{a.score} pt</span>
              </div>
              <div className="quiz-card-content">
                <h3 className="quiz-title">Quiz</h3>
                <p className="quiz-description">Completato il {formatDate(a.completedAt)}</p>
              </div>
              <div className="quiz-card-actions">
                <Link to={`/quiz/${a.quizId}`} className="btn btn-primary btn-play">Rigioca</Link>
                <div className="quiz-secondary-actions">
                  <Link to={`/review/${a.quizId}`} className="btn btn-outline btn-secondary">Rivedi</Link>
                  <Link to={`/leaderboard/${a.quizId}`} className="btn btn-outline btn-secondary">Classifica</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
