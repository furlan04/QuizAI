import { useState } from "react";
import { createQuiz } from "../services/QuizService";
import { getAuthToken } from "../services/CommonService";

export default function QuizCreatePage() {
  const [topic, setTopic]     = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      setMessage("Devi effettuare il login per creare un quiz.");
      setResult({ success: false });
      return;
    }
    setLoading(true);
    const apiResult = await createQuiz(topic, token);
    setResult(apiResult);
    setLoading(false);
    if (apiResult.success) {
      setMessage(`Quiz creato con successo: ${apiResult.title}`);
      setTopic("");
    } else {
      setMessage(apiResult.message || "Errore durante la creazione del quiz");
    }
  };

  return (
    <div className="quiz-create-container">
      <div className="quiz-create-card">
        {/* Header */}
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
                placeholder="Es. Storia Romana, JavaScript avanzato, Cultura Pop degli anni '90..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                rows={4}
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  lineHeight: 1.2,
                  letterSpacing: "-.02em",
                  resize: "vertical",
                  minHeight: 100,
                  padding: "14px 16px",
                }}
              />
              <p className="form-hint">
                Suggerimento: sii specifico per risultati migliori
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-create-quiz"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2.5 }} />
                  Generazione in corso...
                </>
              ) : (
                "Genera Quiz"
              )}
            </button>
          </form>

          {message && (
            <div
              className={`alert ${result?.success ? "alert-success" : "alert-error"}`}
              style={{ marginTop: 16 }}
            >
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
