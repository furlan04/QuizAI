import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QuizList from "../components/QuizList";

export default function QuizListPage() {
  const [location, setLocation] = useState([]);
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildLocation = () => {
      if (userId) {
        return `/Quiz?userId=${userId}`;
      } else {
        return "/Quiz";
      }
    };
    setLocation(buildLocation());
    setLoading(false);
  }, [location, userId]);

  const isMyQuizzes = !userId;
  const pageTitle = isMyQuizzes ? "I miei Quiz" : `Quiz dell'utente`;

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Caricamento quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-list-container">
      {/* Header Section */}
      <div className="quiz-list-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">
              {isMyQuizzes 
                ? "Gestisci e monitora i tuoi quiz creati" 
                : "Esplora i quiz creati da questo utente"
              }
            </p>
          </div>
          {isMyQuizzes && (
            <Link to="/quizzes/create" className="btn btn-primary btn-create">
              Crea Nuovo Quiz
            </Link>
          )}
        </div>
      </div>

      <QuizList location={location}></QuizList>
    </div>
  );
}