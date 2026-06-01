import QuizList from "../components/QuizList";

export default function FYPage() {
  return (
    <div className="quiz-list-container">
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>Per te</h2>
        <a href="/quizzes">Tutti i quiz</a>
      </div>
      <QuizList />
    </div>
  );
}
