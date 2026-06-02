import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMyAttempts } from "../services/QuizAttemptService";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export default function QuizAttemptsPage() {
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { quizId } = useParams();

  useEffect(() => {
    let ignore = false;
    const loadAttempt = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await getMyAttempts(quizId);
        if (ignore) return;
        if (data && data.answers) setAttempt(data);
        else setNotFound(true);
      } catch {
        if (!ignore) setNotFound(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if (quizId) loadAttempt();
    return () => {
      ignore = true;
    };
  }, [quizId]);

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento tentativo…</p>
        </div>
      </div>
    );
  }

  if (notFound || !attempt) {
    return (
      <div className="quiz-list-container">
        <div className="empty-state">
          <div className="empty-title">Nessun tentativo</div>
          <p className="empty-message">Non hai ancora completato questo quiz.</p>
          <Link to={`/quiz/${quizId}`} className="btn btn-primary btn-empty">Gioca ora</Link>
        </div>
      </div>
    );
  }

  const total = attempt.answers.length;
  const correct = attempt.answers.filter((a) => a.isCorrect).length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Il tuo tentativo</h1>
            <p className="page-subtitle">Completato il {formatDate(attempt.completedAt)}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to={`/quiz/${quizId}`} className="btn btn-primary">Rigioca</Link>
            <Link to={`/review/${quizId}`} className="btn btn-outline">Rivedi risposte</Link>
          </div>
        </div>
      </div>

      <div className="result-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <div className="stat-card">
          <div className="stat-value">{attempt.score}</div>
          <div className="stat-label">Punteggio</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Domande</div>
        </div>
        <div className="stat-card" style={{ background: "var(--butter)" }}>
          <div className="stat-value">{percentage}%</div>
          <div className="stat-label">Percentuale</div>
        </div>
      </div>
    </div>
  );
}
