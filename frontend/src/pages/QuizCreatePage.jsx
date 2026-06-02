import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuiz, getQuizById } from "../services/QuizService";


const DIFFICULTIES = [
  { value: "easy",   label: "Facile" },
  { value: "medium", label: "Medio" },
  { value: "hard",   label: "Difficile" },
];

const LOADING_PHRASES = [
  "Penso alle domande...",
  "Consulto le mie conoscenze...",
  "Bilancio la difficoltà...",
  "Scelgo le risposte giuste...",
  "Aggiungo qualche tranello...",
  "Rifinisco le spiegazioni...",
  "Assegno i tag tematici...",
  "Quasi pronto...",
];

export default function QuizCreatePage() {
  const [topic, setTopic]               = useState("");
  const [difficulty, setDifficulty]     = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [message, setMessage]           = useState("");
  const [isError, setIsError]           = useState(false);
  // phase: 'form' | 'submitting' | 'generating' | 'failed'
  const [phase, setPhase]               = useState("form");
  const [phraseIndex, setPhraseIndex]   = useState(0);
  const navigate = useNavigate();
  const pollRef = useRef(null);

  // Rotazione delle frasi durante il caricamento
  useEffect(() => {
    if (phase !== "generating" && phase !== "submitting") return;
    const t = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length);
    }, 2600);
    return () => clearInterval(t);
  }, [phase]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setPhase("submitting");

    const result = await generateQuiz(topic, difficulty, Number(numQuestions));

    if (!result.success || !result.quizId) {
      setIsError(true);
      setMessage(result.message || "Errore durante la generazione del quiz");
      setPhase("form");
      return;
    }

    // Polling finché il quiz non è pronto (o fallisce), con timeout di 60s
    setPhase("generating");
    const quizId = result.quizId;
    const deadline = Date.now() + 60_000;

    const poll = async () => {
      if (Date.now() > deadline) {
        setIsError(true);
        setMessage("Timeout: la generazione sta impiegando troppo tempo. Riprova più tardi.");
        setPhase("failed");
        return;
      }
      const data = await getQuizById(quizId);
      if (data?.generating || data?.status === "generating") {
        pollRef.current = setTimeout(poll, 2500);
        return;
      }
      if (data?.status === "failed" || data?.error) {
        setIsError(true);
        setMessage(data.error || "La generazione del quiz è fallita");
        setPhase("failed");
        return;
      }
      // Pronto → apri il dettaglio del quiz appena creato
      navigate(`/quizzes/${quizId}`);
    };
    poll();
  };

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  // ── Schermata di caricamento ──
  if (phase === "submitting" || phase === "generating") {
    return (
      <div className="quiz-create-container">
        <style>{`
          @keyframes qg-orbit { to { transform: rotate(360deg); } }
          @keyframes qg-pulse { 0%,100% { transform: scale(1); opacity:.9 } 50% { transform: scale(1.12); opacity:1 } }
          @keyframes qg-fade  { 0% { opacity:0; transform: translateY(6px) } 15%,85% { opacity:1; transform:none } 100% { opacity:0; transform: translateY(-6px) } }
          @keyframes qg-dot   { 0%,80%,100% { opacity:.25 } 40% { opacity:1 } }
        `}</style>
        <div className="quiz-create-card" style={{ textAlign: "center", padding: "56px 32px" }}>
          {/* Anello orbitante con nucleo pulsante */}
          <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 28px" }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "4px solid var(--cream,#efe9da)",
              borderTopColor: "var(--violet,#7c5cff)",
              borderRightColor: "var(--coral,#ff6b5e)",
              animation: "qg-orbit 1.1s linear infinite",
            }} />
            <div style={{
              position: "absolute", inset: 30, borderRadius: "50%",
              background: "var(--lime,#d6f25b)",
              border: "2.5px solid var(--ink,#1a1726)",
              animation: "qg-pulse 1.6s ease-in-out infinite",
            }} />
          </div>

          <h1 className="create-title" style={{ marginBottom: 10 }}>Sto creando il tuo quiz</h1>

          {/* Frase a rotazione */}
          <p
            key={phraseIndex}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 15, color: "var(--ink-soft,#6b6578)",
              minHeight: 24, animation: "qg-fade 2.6s ease-in-out",
            }}
          >
            {LOADING_PHRASES[phraseIndex]}
          </p>

          {/* Puntini animati */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                width: 9, height: 9, borderRadius: "50%", background: "var(--ink,#1a1726)",
                animation: `qg-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>

          <p className="form-hint" style={{ marginTop: 26 }}>
            Può richiedere qualche secondo. Non chiudere la pagina.
          </p>
        </div>
      </div>
    );
  }

  // ── Form (anche stato 'failed' torna qui con messaggio) ──
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

            <button type="submit" className="btn btn-primary btn-create-quiz">
              Genera Quiz
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
