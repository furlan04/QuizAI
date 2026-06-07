import { useState, useEffect, useRef, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuiz, generateQuizFromFile, getQuizById } from "../services/QuizService";


const DIFFICULTIES = [
  { value: "easy",   label: "Facile" },
  { value: "medium", label: "Medio" },
  { value: "hard",   label: "Difficile" },
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".pptx"];
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

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
  // Campi del form raggruppati in un reducer (merge per patch).
  const [form, setForm] = useReducer((s, patch) => ({ ...s, ...patch }), {
    mode: "topic", // 'topic' | 'document'
    topic: "", file: null, difficulty: "medium", numQuestions: 5,
    deepSearch: false, // ricerca web prima della generazione (solo modalità argomento)
  });
  const { mode, topic, file, difficulty, numQuestions, deepSearch } = form;
  // Stato di invio/esito raggruppato. phase: 'form' | 'submitting' | 'generating' | 'failed'
  const [status, setStatus] = useReducer((s, patch) => ({ ...s, ...patch }), {
    phase: "form", message: "", isError: false,
  });
  const { phase, message, isError } = status;
  const [phraseIndex, setPhraseIndex]   = useState(0);
  const navigate = useNavigate();
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Rotazione delle frasi durante il caricamento
  useEffect(() => {
    if (phase !== "generating" && phase !== "submitting") return;
    const t = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length);
    }, 2600);
    return () => clearInterval(t);
  }, [phase]);

  // Polling condiviso: attende che il quiz sia pronto (o fallisca), timeout 60s.
  const beginPolling = (quizId) => {
    setStatus({ phase: "generating" });
    const deadline = Date.now() + 60_000;

    const poll = async () => {
      if (Date.now() > deadline) {
        setStatus({ isError: true, message: "Timeout: la generazione sta impiegando troppo tempo. Riprova più tardi.", phase: "failed" });
        return;
      }
      const data = await getQuizById(quizId);
      if (data?.generating || data?.status === "generating") {
        pollRef.current = setTimeout(poll, 2500);
        return;
      }
      if (data?.status === "failed" || data?.error) {
        setStatus({ isError: true, message: data.error || "La generazione del quiz è fallita", phase: "failed" });
        return;
      }
      // Pronto -> apri il dettaglio del quiz appena creato
      navigate(`/quizzes/${quizId}`);
    };
    poll();
  };

  const handleSelectFile = (e) => {
    const picked = e.target.files?.[0] || null;
    if (!picked) { setForm({ file: null }); return; }

    const lower = picked.name.toLowerCase();
    const okType = ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!okType) {
      setStatus({ isError: true, message: "Formato non supportato. Usa PDF, DOCX o PPTX.", phase: "form" });
      setForm({ file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setStatus({ isError: true, message: "File troppo grande (max 15 MB).", phase: "form" });
      setForm({ file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setStatus({ message: "", isError: false });
    setForm({ file: picked });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (mode === "document" && !file) {
      setStatus({ isError: true, message: "Seleziona un documento (PDF, DOCX o PPTX).", phase: "form" });
      return;
    }

    setStatus({ message: "", isError: false, phase: "submitting" });

    const result = mode === "document"
      ? await generateQuizFromFile(file, difficulty, Number(numQuestions))
      : await generateQuiz(topic, difficulty, Number(numQuestions), deepSearch);

    if (!result.success || !result.quizId) {
      setStatus({ isError: true, message: result.message || "Errore durante la generazione del quiz", phase: "form" });
      return;
    }

    beginPolling(result.quizId);
  };

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  // ── Schermata di caricamento ──
  if (phase === "submitting" || phase === "generating") {
    return (
      <div className="quiz-create-container">
        <style>{`
          @keyframes qg-orbit { to { transform: rotate(360deg); } }
          @keyframes qg-pulse { 0%,100% { transform: scale(1); opacity:.9 } 50% { transform: scale(1.12); opacity:1 } }
          @keyframes qg-fade  { from { opacity:0; transform: translateY(6px) } to { opacity:1; transform:none } }
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
              animation: "qg-orbit 0.9s linear infinite",
            }} />
            <div style={{
              position: "absolute", inset: 30, borderRadius: "50%",
              background: "var(--lime,#d6f25b)",
              border: "2.5px solid var(--ink,#1a1726)",
              animation: "qg-pulse 0.9s ease-in-out infinite",
            }} />
          </div>

          <h1 className="create-title" style={{ marginBottom: 10 }}>Sto creando il tuo quiz</h1>

          {/* Frase a rotazione */}
          <p
            key={phraseIndex}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 15, color: "var(--ink-soft,#6b6578)",
              minHeight: 24, animation: "qg-fade 0.5s ease-out",
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
          <p className="create-subtitle">Parti da un argomento o da un tuo documento, al resto pensa l&apos;AI</p>
        </div>

        <div className="create-content">
          {/* Selettore modalità: argomento libero oppure documento caricato */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button
              type="button"
              className={`btn ${mode === "topic" ? "btn-primary" : "btn-outline"}`}
              onClick={() => { setForm({ mode: "topic" }); setStatus({ message: "", isError: false }); }}
              style={{ flex: "1 1 0", minWidth: 120 }}
            >
              Argomento
            </button>
            <button
              type="button"
              className={`btn ${mode === "document" ? "btn-primary" : "btn-outline"}`}
              onClick={() => { setForm({ mode: "document" }); setStatus({ message: "", isError: false }); }}
              style={{ flex: "1 1 0", minWidth: 120 }}
            >
              Da documento
            </button>
          </div>

          <form onSubmit={handleCreate} className="create-form">
            {mode === "topic" ? (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="create-topic">Di cosa parla il tuo quiz?</label>
                  <textarea
                    id="create-topic"
                    className="form-control create-topic-input"
                    placeholder="Es. Storia Romana, JavaScript avanzato, Cultura Pop anni '90..."
                    value={topic}
                    onChange={(e) => setForm({ topic: e.target.value })}
                    required
                    maxLength={200}
                    rows={4}
                  />
                  <p className="form-hint">Sii specifico per risultati migliori (max 200 caratteri)</p>
                </div>

                {/* Deep search: consulta il web prima di generare (solo argomento) */}
                <div className="form-group">
                  <label className="deep-search-toggle" htmlFor="create-deepsearch">
                    <span className="deep-search-text">
                      <span className="deep-search-label">Ricerca web (deep search)</span>
                      <span className="form-hint" style={{ margin: 0 }}>
                        L&apos;AI consulta il web per informazioni aggiornate sull&apos;argomento. La generazione può richiedere più tempo.
                      </span>
                    </span>
                    <input
                      id="create-deepsearch"
                      type="checkbox"
                      role="switch"
                      className="deep-search-input"
                      checked={deepSearch}
                      onChange={(e) => setForm({ deepSearch: e.target.checked })}
                    />
                    <span className="deep-search-track" aria-hidden="true">
                      <span className="deep-search-thumb" />
                    </span>
                  </label>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="create-file">Carica un documento</label>
                <input
                  id="create-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx"
                  onChange={handleSelectFile}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn btn-outline create-file-drop"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span style={{ fontWeight: 700, fontSize: 17 }}>
                    {file ? file.name : "Scegli un file PDF, DOCX o PPTX"}
                  </span>
                  <span className="form-hint" style={{ margin: 0 }}>
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(1)} MB — clicca per cambiare`
                      : "Clicca per selezionare (max 15 MB)"}
                  </span>
                </button>
                <p className="form-hint">
                  L&apos;AI genera le domande dal contenuto del file. Il documento non viene salvato: viene eliminato subito dopo la generazione.
                </p>
              </div>
            )}

            <div className="form-group">
              <div className="form-label">Difficoltà</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {DIFFICULTIES.map((d) => (
                  <button
                    type="button"
                    key={d.value}
                    className={`btn ${difficulty === d.value ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setForm({ difficulty: d.value })}
                    style={{ flex: "1 1 auto", minWidth: 90 }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="create-numq">Numero di domande: {numQuestions}</label>
              <input
                id="create-numq"
                type="range"
                min={1}
                max={20}
                value={numQuestions}
                onChange={(e) => setForm({ numQuestions: e.target.value })}
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
