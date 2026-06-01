import { useEffect, useState } from "react";
import { getQuizzes } from "../services/QuizService";
import { getAuthToken } from "../services/CommonService";
import { Link } from "react-router-dom";

const COVER_CLASSES = [
  "quiz-cover-0", "quiz-cover-1", "quiz-cover-2",
  "quiz-cover-3", "quiz-cover-4", "quiz-cover-5",
];

const DIFFICULTY_LABEL = { easy: "Facile", medium: "Medio", hard: "Difficile" };

/**
 * Lista di quiz pronti.
 * Props:
 *   - creatorId: se valorizzato, mostra solo i quiz creati da quell'utente (filtro client-side)
 *   - filter:    { topic, difficulty } filtri server-side opzionali
 */
export default function QuizList({ creatorId = null, filter = {} }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      const token = getAuthToken();
      if (!token) { setQuizzes([]); setLoading(false); return; }
      try {
        const data = await getQuizzes(token, filter);
        let items = data?.items || [];
        if (creatorId) items = items.filter((q) => q.createdBy === creatorId);
        setQuizzes(items);
      } catch (error) {
        console.error("Errore nel caricamento dei quiz:", error);
        setQuizzes([]);
      }
      setLoading(false);
    };
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatorId, filter.topic, filter.difficulty]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Caricamento quiz...</p>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-title">Nessun quiz disponibile</div>
        <p className="empty-message">Non ci sono quiz da mostrare al momento.</p>
      </div>
    );
  }

  return (
    <div className="quiz-grid">
      {quizzes.map((quiz, idx) => (
        <article key={quiz.id} className="quiz-card">
          <div className={`quiz-card-header ${COVER_CLASSES[idx % COVER_CLASSES.length]}`}>
            <span className="quiz-ai-badge">AI</span>
          </div>

          <div className="quiz-card-content">
            <h3 className="quiz-title">{quiz.title}</h3>
            <p className="quiz-description">
              {DIFFICULTY_LABEL[quiz.difficulty] || quiz.difficulty} · {quiz.numQuestions} domande
            </p>
            {quiz.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {quiz.tags.slice(0, 3).map((t) => (
                  <span key={t} style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
                    background: "var(--cream,#f3f0e7)", border: "1.5px solid var(--ink)",
                    borderRadius: 100, padding: "2px 8px",
                  }}>{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="quiz-card-actions">
            <Link to={`/quiz/${quiz.id}`} className="btn btn-primary btn-play">Gioca</Link>
            <Link to={`/quizzes/${quiz.createdBy}`} className="btn btn-primary-outline btn-secondary">
              Quiz del creatore
            </Link>
            <div className="quiz-secondary-actions">
              <Link to={`/leaderboard/${quiz.id}`} className="btn btn-outline btn-secondary">Classifica</Link>
              <Link to={`/attempts/${quiz.id}`} className="btn btn-outline btn-secondary">Tentativi</Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
