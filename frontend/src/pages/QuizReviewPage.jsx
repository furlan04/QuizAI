import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMyAttempts } from "../services/QuizAttemptService";
import { getQuizById } from "../services/QuizService";
import { Check, X } from "../components/ui/Icon";


const LETTER = ["A", "B", "C", "D", "E", "F"];

export default function QuizReviewPage() {
  // il parametro route è il quizId (un utente ha un tentativo per quiz)
  const { attemptId: quizId } = useParams();
  const [quiz, setQuiz]       = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [q, a] = await Promise.all([
          getQuizById(quizId),
          getMyAttempts(quizId),
        ]);
        if (!q?.questions) throw new Error("Quiz non disponibile");
        if (!a?.answers) throw new Error("Tentativo non trovato");
        setQuiz(q);
        setAttempt(a);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (quizId) load();
  }, [quizId]);

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento revisione…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-list-container">
        <div className="error-state">
          <div className="error-title">{error}</div>
          <Link to="/quizzes" className="btn btn-primary" style={{ marginTop: 16 }}>Torna ai Quiz</Link>
        </div>
      </div>
    );
  }

  const answerByIndex = {};
  attempt.answers.forEach((a) => { answerByIndex[a.questionIndex] = a; });

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Revisione: {quiz.title}</h1>
            <p className="page-subtitle">Punteggio {attempt.score} / {quiz.questions.length}</p>
          </div>
          <Link to={`/quiz/${quizId}`} className="btn btn-primary">Rigioca</Link>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {quiz.questions.map((q, qi) => {
          const given = answerByIndex[qi];
          const selectedIndex = given ? given.selectedIndex : null;
          const isCorrect = given ? given.isCorrect : false;
          return (
            <div key={qi} style={{
              background: "#fff", border: "2px solid var(--ink)",
              borderRadius: "var(--radius,12px)", boxShadow: "3px 3px 0 0 var(--ink)",
              padding: "18px 20px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <strong>Domanda {qi + 1}</strong>
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12,
                  color: isCorrect ? "var(--mint,green)" : "var(--coral,red)",
                }}>
                  {isCorrect ? "Corretta" : "Sbagliata"}
                </span>
              </div>
              <p style={{ fontWeight: 700, marginBottom: 12 }}>{q.text}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {q.options.map((opt, oi) => {
                  const isCorrectOpt = oi === q.correctIndex;
                  const isSelectedWrong = oi === selectedIndex && !isCorrect;
                  let bg = "transparent";
                  if (isCorrectOpt) bg = "rgba(0,180,90,.15)";
                  else if (isSelectedWrong) bg = "rgba(230,60,60,.15)";
                  return (
                    <div key={oi} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", borderRadius: 8,
                      border: "1.5px solid var(--ink)", background: bg,
                    }}>
                      <span style={{ fontWeight: 700 }}>{LETTER[oi] || oi + 1}</span>
                      <span style={{ flex: 1 }}>{opt}</span>
                      {isCorrectOpt && <Check size={18} style={{ color: "rgb(0,160,80)" }} />}
                      {isSelectedWrong && <X size={18} style={{ color: "rgb(214,55,55)" }} />}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <p style={{ marginTop: 12, fontSize: 13, color: "var(--ink-soft)" }}>
                  <strong>Spiegazione:</strong> {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
