import { useEffect, useState } from "react";
import { getQuizzesFromLocation } from "../services/QuizService";
import { getAuthToken } from "../services/CommonService";
import { Link } from "react-router-dom";
import LikeButton from "./LikeButton";

/* Pick one of 6 abstract cover styles cycling by index */
const COVER_CLASSES = [
  "quiz-cover-0",
  "quiz-cover-1",
  "quiz-cover-2",
  "quiz-cover-3",
  "quiz-cover-4",
  "quiz-cover-5",
];

export default function QuizList({ location }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      const token = getAuthToken();
      if (token) {
        try {
          const data = await getQuizzesFromLocation(token, location);
          setQuizzes(data);
        } catch (error) {
          console.error("Errore nel caricamento dei quiz:", error);
          setQuizzes([]);
        }
      }
      setLoading(false);
    };
    fetchQuizzes();
  }, [location]);

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
          {/* Coloured cover */}
          <div className={`quiz-card-header ${COVER_CLASSES[idx % COVER_CLASSES.length]}`}>
            <span className="quiz-ai-badge">AI</span>
            <span className="quiz-like-button">
              <LikeButton postId={quiz.id} />
            </span>
          </div>

          {/* Title + description */}
          <div className="quiz-card-content">
            <h3 className="quiz-title">{quiz.title}</h3>
            <p className="quiz-description">
              {quiz.description || "Nessuna descrizione disponibile"}
            </p>
          </div>

          {/* Actions */}
          <div className="quiz-card-actions">
            <Link to={`/quiz/${quiz.id}`} className="btn btn-primary btn-play">
              Gioca
            </Link>

            <Link to={`/profile/${quiz.userId}`} className="btn btn-primary-outline btn-secondary">
              Profilo creatore
            </Link>

            <div className="quiz-secondary-actions">
              <Link to={`/leaderboard/${quiz.id}`} className="btn btn-outline btn-secondary">
                Classifica
              </Link>
              <Link to={`/attempts/${quiz.id}`} className="btn btn-outline btn-secondary">
                Tentativi
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
