import { Link, useParams } from "react-router-dom";
import QuizList from "../components/QuizList";
import { useAuth } from "../auth/AuthContext";

export default function QuizListPage() {
  const { userId } = useParams();
  const { user: me } = useAuth();

  // Senza parametro -> i miei quiz (filtro per createdBy === mio id)
  const creatorId = userId || me?.userId || null;
  const isMyQuizzes = !userId;
  const pageTitle = isMyQuizzes ? "I miei Quiz" : "Quiz dell'utente";

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">
              {isMyQuizzes
                ? "Gestisci e monitora i tuoi quiz creati"
                : "Esplora i quiz creati da questo utente"}
            </p>
          </div>
          {isMyQuizzes && (
            <Link to="/quizzes/create" className="btn btn-primary btn-create">
              Crea Nuovo Quiz
            </Link>
          )}
        </div>
      </div>

      <QuizList creatorId={creatorId} />
    </div>
  );
}
