import { Link } from "react-router-dom";

// I "mi piace" non sono ancora supportati dai microservizi.
export default function LikedQuizzesPage() {
  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Quiz che ti piacciono</h1>
            <p className="page-subtitle">Funzionalità in arrivo</p>
          </div>
        </div>
      </div>
      <div className="empty-state">
        <div className="empty-title">Funzionalità non ancora disponibile</div>
        <p className="empty-message">I "mi piace" non sono ancora supportati. Nel frattempo esplora i quiz!</p>
        <Link to="/quizzes" className="btn btn-primary btn-empty">Esplora quiz</Link>
      </div>
    </div>
  );
}
