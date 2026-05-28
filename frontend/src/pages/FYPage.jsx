import { useEffect, useState } from "react";
import QuizList from "../components/QuizList";

export default function FYPage() {
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLocation("/User/LoadFeed");
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-list-container">
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>Per te</h2>
        <a href="/quizzes">Tutti i quiz</a>
      </div>

      <QuizList location={location} />
    </div>
  );
}
