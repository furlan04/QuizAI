import { useEffect, useState } from "react";
import QuizList from "../components/QuizList";

// Pagina: LikedQuizzesPage
export default function LikedQuizzesPage() {
  const [location, setLocation] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildLocation = () => {
      return `/User/GetLikedQuizzes`;
    };
    setLocation(buildLocation());
    setLoading(false);
  }, [location]);

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Caricamento quiz piaciuti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Quiz che ti piacciono</h1>
            <p className="page-subtitle">Esplora i quiz che hai messo tra i preferiti</p>
          </div>
        </div>
      </div>
      <QuizList location={location} />
    </div>
  );
}
