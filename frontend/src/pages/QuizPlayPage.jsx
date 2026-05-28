import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getQuizById } from "../services/QuizService";
import { submitQuizAttempt } from "../services/QuizAttemptService";
import { getAuthToken } from "../services/CommonService";

const LETTER = ["A", "B", "C", "D", "E", "F"];

export default function QuizPlayPage() {
  const { id } = useParams();
  const [quiz, setQuiz]                 = useState(null);
  const [answers, setAnswers]           = useState({});
  const [result, setResult]             = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult]     = useState(false);
  const [fade, setFade]                 = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id || id === "undefined") return;
    const fetchQuiz = async () => {
      try {
        const quizData = await getQuizById(id, getAuthToken());
        setQuiz(quizData);
      } catch (err) {
        console.error("Errore caricamento quiz:", err);
      }
    };
    fetchQuiz();
  }, [id]);

  if (!id || id === "undefined") {
    return (
      <div className="quiz-play-container">
        <div className="error-state">
          <div className="error-title">ID Quiz non valido</div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-play-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz.questions || !Array.isArray(quiz.questions)) {
    return (
      <div className="quiz-play-container">
        <div className="error-state">
          <div className="error-title">Il quiz non contiene domande valide</div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentIndex];
  const total    = quiz.questions.length;

  const handleOptionClick = (i) => {
    setAnswers({ ...answers, [currentIndex]: i });
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    const submitData = {
      quizId: id,
      answers: quiz.questions.map((q, index) => ({
        questionQuizId:      q.quizId,
        questionOrder:       q.order,
        selectedAnswerIndex: answers[index] ?? 0,
      })),
    };
    try {
      const res = await submitQuizAttempt(submitData, getAuthToken());
      setResult(res);
      setShowResult(true);
    } catch {
      const correct = quiz.questions.reduce(
        (acc, q, idx) => (answers[idx] === q.correctAnswerIndex ? acc + 1 : acc), 0
      );
      setResult({
        score: correct,
        percentage: Math.round((correct / total) * 100),
        totalQuestions: total,
      });
      setShowResult(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setFade(false);
    setTimeout(async () => {
      if (currentIndex + 1 < total) {
        setCurrentIndex(currentIndex + 1);
        setFade(true);
      } else {
        await submitQuiz();
        setFade(true);
      }
    }, 300);
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    setShowResult(false);
    setFade(true);
  };

  const isSelected = (i) => answers[currentIndex] === i;

  return (
    <div className="quiz-play-container">
      <div className={`quiz-play-card ${fade ? "fade-in" : "fade-out"}`}>
        {!showResult ? (
          <>
            {/* Header */}
            <div className="quiz-header">
              {/* Progress dots */}
              <div className="q-progress-dots">
                {quiz.questions.map((_, i) => (
                  <div
                    key={i}
                    className={`q-dot${i < currentIndex ? " done" : i === currentIndex ? " now" : ""}`}
                  />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <h1 className="quiz-title-play">{quiz.title}</h1>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ink-soft)",
                  whiteSpace: "nowrap",
                }}>
                  {currentIndex + 1} / {total}
                </span>
              </div>
            </div>

            {/* Question */}
            <div className="question-container">
              <p className="question-text">{question.text}</p>
            </div>

            {/* Options */}
            <div className="options-container">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  className={`option-button${isSelected(i) ? " selected" : ""}`}
                  onClick={() => handleOptionClick(i)}
                  disabled={isSubmitting}
                >
                  <span className="option-letter">{LETTER[i] || i + 1}</span>
                  <span className="option-text">{opt}</span>
                  {isSelected(i) && (
                    <svg className="option-check" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5 9-11"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Next action */}
            <div className="quiz-actions">
              <button
                className="btn btn-primary btn-next"
                onClick={handleNext}
                disabled={answers[currentIndex] === undefined || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2.5, borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} />
                    Invio...
                  </>
                ) : currentIndex + 1 < total ? (
                  "Prossima domanda"
                ) : (
                  "Vedi risultato"
                )}
              </button>
            </div>
          </>
        ) : (
          /* ── Results ── */
          <div className="result-container">
            <div className="result-header">
              <div>
                <h1 className="result-title">Quiz completato!</h1>
                <div style={{ fontSize: 15, color: "var(--ink-2, #2C2740)", marginTop: 6 }}>
                  Hai risposto correttamente a <strong>{result.score}</strong> domande su <strong>{result.totalQuestions}</strong>.
                </div>
              </div>
              <div className="result-score-big">
                {result.score}
                <small>/ {result.totalQuestions}</small>
              </div>
            </div>

            <div className="result-stats">
              <div className="stat-card">
                <div className="stat-value">{result.score}</div>
                <div className="stat-label">Risposte corrette</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{result.totalQuestions}</div>
                <div className="stat-label">Domande totali</div>
              </div>
              <div className="stat-card" style={{ background: "var(--butter)" }}>
                <div className="stat-value">{result.percentage}%</div>
                <div className="stat-label">Percentuale</div>
              </div>
            </div>

            <div className="result-message">
              {result.percentage >= 80 ? (
                <p className="success-message">Eccellente! Grande conoscenza dimostrata.</p>
              ) : result.percentage >= 60 ? (
                <p className="good-message">Buon lavoro! Continua a migliorare.</p>
              ) : (
                <p className="encourage-message">Non mollare, riprova per migliorare!</p>
              )}
            </div>

            <div className="result-actions">
              <button className="btn btn-primary btn-retry" onClick={resetQuiz}>
                Riprova Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
