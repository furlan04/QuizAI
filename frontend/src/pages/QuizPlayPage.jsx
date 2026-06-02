import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getQuizById } from "../services/QuizService";
import { startSession, answerQuestion, completeSession } from "../services/QuizAttemptService";


const LETTER = ["A", "B", "C", "D", "E", "F"];

export default function QuizPlayPage() {
  const { id } = useParams();

  // phase: 'loading' | 'generating' | 'failed' | 'playing' | 'done'
  const [phase, setPhase]               = useState("loading");
  const [quiz, setQuiz]                 = useState(null);
  const [sessionId, setSessionId]       = useState(null);
  const [questions, setQuestions]       = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected]         = useState(null);
  const [feedback, setFeedback]         = useState(null); // { isCorrect, correctIndex, explanation }
  const [result, setResult]             = useState(null); // { score, totalQuestions, percentage }
  const [error, setError]               = useState(null);
  const [busy, setBusy]                 = useState(false);
  const pollRef = useRef(null);

  // Carica il quiz, gestendo lo stato di generazione con polling
  useEffect(() => {
    if (!id || id === "undefined") { setError("ID quiz non valido"); setPhase("failed"); return; }
    let cancelled = false;

    const load = async () => {
      const data = await getQuizById(id);

      if (cancelled) return;

      if (data?.generating || data?.status === "generating") {
        setPhase("generating");
        pollRef.current = setTimeout(load, 2500); // riprova finché pronto
        return;
      }
      if (data?.status === "failed" || data?.error) {
        setError(data.error || "Generazione del quiz fallita");
        setPhase("failed");
        return;
      }
      setQuiz(data);
      // Avvia la sessione di gioco
      const session = await startSession(id);
      if (cancelled) return;
      if (session?.sessionId) {
        setSessionId(session.sessionId);
        setQuestions(session.questions || []);
        setPhase("playing");
      } else {
        setError("Impossibile avviare la sessione");
        setPhase("failed");
      }
    };

    load();
    return () => { cancelled = true; if (pollRef.current) clearTimeout(pollRef.current); };
  }, [id]);

  const total = questions.length;
  const question = questions[currentIndex];

  const submitAnswer = async () => {
    if (selected === null || busy) return;
    setBusy(true);
    const res = await answerQuestion(sessionId, currentIndex, selected);
    setBusy(false);
    setFeedback(res); // { isCorrect, correctIndex, explanation }
  };

  const next = async () => {
    if (currentIndex + 1 < total) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
      setFeedback(null);
    } else {
      setBusy(true);
      const res = await completeSession(sessionId);
      setBusy(false);
      setResult(res);
      setPhase("done");
    }
  };

  // ── Stati di caricamento / errore ──
  if (phase === "loading" || phase === "generating") {
    return (
      <div className="quiz-play-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">
            {phase === "generating" ? "L'AI sta generando il quiz..." : "Caricamento quiz..."}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="quiz-play-container">
        <div className="error-state">
          <div className="error-title">{error || "Errore"}</div>
          <Link to="/quizzes" className="btn btn-primary" style={{ marginTop: 16 }}>Torna ai quiz</Link>
        </div>
      </div>
    );
  }

  // ── Risultato finale ──
  if (phase === "done" && result) {
    return (
      <div className="quiz-play-container">
        <div className="quiz-play-card">
          <div className="result-container">
            <div className="result-header">
              <div>
                <h1 className="result-title">Quiz completato!</h1>
                <div style={{ fontSize: 15, color: "var(--ink-2,#2C2740)", marginTop: 6 }}>
                  Hai risposto correttamente a <strong>{result.score}</strong> domande su <strong>{result.totalQuestions}</strong>.
                </div>
              </div>
              <div className="result-score-big">
                {result.score}<small>/ {result.totalQuestions}</small>
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
                <div className="stat-value">{Math.round(result.percentage)}%</div>
                <div className="stat-label">Percentuale</div>
              </div>
            </div>

            <div className="result-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link to={`/leaderboard/${id}`} className="btn btn-primary">Classifica</Link>
              <Link to="/quizzes" className="btn btn-outline">Altri quiz</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Gioco ──
  if (!question) {
    return (
      <div className="quiz-play-container">
        <div className="error-state">
          <div className="error-title">Il quiz non contiene domande valide</div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-play-container">
      <div className="quiz-play-card fade-in">
        <div className="quiz-header">
          <div className="q-progress-dots">
            {questions.map((_, i) => (
              <div key={i} className={`q-dot${i < currentIndex ? " done" : i === currentIndex ? " now" : ""}`} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h1 className="quiz-title-play">{quiz?.title || "Quiz"}</h1>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
              {currentIndex + 1} / {total}
            </span>
          </div>
        </div>

        <div className="question-container">
          <p className="question-text">{question.text}</p>
        </div>

        <div className="options-container">
          {question.options.map((opt, i) => {
            let cls = "option-button";
            if (feedback) {
              if (i === feedback.correctIndex) cls += " selected";
              else if (i === selected) cls += "";
            } else if (selected === i) cls += " selected";
            return (
              <button
                key={i}
                className={cls}
                onClick={() => !feedback && setSelected(i)}
                disabled={busy || !!feedback}
              >
                <span className="option-letter">{LETTER[i] || i + 1}</span>
                <span className="option-text">{opt}</span>
                {feedback && i === feedback.correctIndex && (
                  <span className="option-check" style={{ marginLeft: "auto", color: "var(--mint,green)" }}>✓</span>
                )}
                {feedback && i === selected && i !== feedback.correctIndex && (
                  <span className="option-check" style={{ marginLeft: "auto", color: "var(--coral,red)" }}>✗</span>
                )}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className={`alert ${feedback.isCorrect ? "alert-success" : "alert-error"}`} style={{ marginTop: 14 }}>
            <div className="alert-content" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <span className="alert-text" style={{ fontWeight: 800 }}>
                {feedback.isCorrect ? "Corretto!" : "Sbagliato"}
              </span>
              <span className="alert-text">{feedback.explanation}</span>
            </div>
          </div>
        )}

        <div className="quiz-actions">
          {!feedback ? (
            <button className="btn btn-primary btn-next" onClick={submitAnswer} disabled={selected === null || busy}>
              {busy ? "Invio..." : "Conferma risposta"}
            </button>
          ) : (
            <button className="btn btn-primary btn-next" onClick={next} disabled={busy}>
              {currentIndex + 1 < total ? "Prossima domanda" : "Vedi risultato"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
