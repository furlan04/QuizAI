import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuiz } from "../services/QuizService";
import { getAuthToken } from "../services/CommonService";

const DIFFICULTIES = [
  { value: "easy",   label: "Facile" },
  { value: "medium", label: "Medio" },
  { value: "hard",   label: "Difficile" },
];

export default function QuizCreatePage() {
  const [topic, setTopic]             = useState("");
  const [difficulty, setDifficulty]   = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [message, setMessage]         = useState("");
  const [loading, setLoading]         = useState(false);
  const [isError, setIsError]         = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      setIsError(true);
      setMessage("Devi effettuare il login per creare un quiz.");
      return;
    }
    setLoading(true);
    setMessage("");
    setIsError(false);

    const result = await generateQuiz(topic, difficulty, Number(numQuestions), token);
    setLoading(false);

    if (result.success && result.quizId) {
      // La generazione è asincrona: torna ai propri quiz, comparirà quando sarà pronto
      navigate("/quizzes");
    } else {
      setIsError(true);
      setMessage(result.message || "Errore durante la generazione del quiz");
    }
  };

  return (
    <div className="quiz-create-container">
      <div className="quiz-create-card">
        <div className="create-header">
          <h1 className="create-title">Crea un nuovo Quiz</h1>
          <p className="create-subtitle">Descrivi l&apos;argomento, al resto pensa l&apos;AI</p>
        </div>

        <div className="create-content">
          <form onSubmit={handleCreate} className="create-form">
            <div className="form-group">
              <label className="form-label">Di cosa parla il tuo quiz?</label>
              <textarea
                className="form-control"
                placeholder="Es. Storia Romana, JavaScript avanzato, Cultura Pop anni '90..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                maxLength={200}
                rows={4}
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 700, fontSize: 22, lineHeight: 1.2,
                  letterSpacing: "-.02em", resize: "vertical",
                  minHeight: 100, padding: "14px 16px",
                }}
              />
              <p className="form-hint">Sii specifico per risultati migliori (max 200 caratteri)</p>
            </div>

            <div className="form-group">
              <label className="form-label">Difficoltà</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {DIFFICULTIES.map((d) => (
                  <button
                    type="button"
                    key={d.value}
                    className={`btn ${difficulty === d.value ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setDifficulty(d.value)}
                    style={{ flex: "1 1 auto", minWidth: 90 }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Numero di domande: {numQuestions}</label>
              <input
                type="range"
                min={1}
                max={20}
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-create-quiz" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2.5 }} />
                  Generazione in corso...
                </>
              ) : "Genera Quiz"}
            </button>
          </form>

          {message && (
            <div className={`alert ${isError ? "alert-error" : "alert-success"}`} style={{ marginTop: 16 }}>
              <div className="alert-content">
                <span className="alert-text">{message}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
