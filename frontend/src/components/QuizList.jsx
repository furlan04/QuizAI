import { useEffect, useState, useMemo } from "react";
import { getQuizzes } from "../services/QuizService";

import { Link } from "react-router-dom";

const COVER_CLASSES = [
  "quiz-cover-0", "quiz-cover-1", "quiz-cover-2",
  "quiz-cover-3", "quiz-cover-4", "quiz-cover-5",
];

const DIFFICULTY_LABEL = { easy: "Facile", medium: "Medio", hard: "Difficile" };
const DIFFICULTIES = [
  { value: "",       label: "Tutte" },
  { value: "easy",   label: "Facile" },
  { value: "medium", label: "Medio" },
  { value: "hard",   label: "Difficile" },
];

/**
 * Lista di quiz pronti.
 * Props:
 *   - creatorId:    se valorizzato, mostra solo i quiz creati da quell'utente (filtro client-side)
 *   - searchable:   se true (default), mostra la barra di ricerca/filtri
 *   - initialTopic: valore iniziale del topic
 */
export default function QuizList({ creatorId = null, searchable = true, initialTopic = "" }) {
  const [topic, setTopic]           = useState(initialTopic);
  const [debouncedTopic, setDebouncedTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState("");
  const [quizzes, setQuizzes]       = useState([]);
  const [loading, setLoading]       = useState(true);

  // Debounce della ricerca topic per evitare richieste a ogni tasto
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTopic(topic.trim()), 300);
    return () => clearTimeout(t);
  }, [topic]);

  const filter = useMemo(() => ({
    topic:      debouncedTopic || undefined,
    difficulty: difficulty     || undefined,
  }), [debouncedTopic, difficulty]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const data = await getQuizzes(filter);
        let items = data?.items || [];
        if (creatorId) items = items.filter((q) => q.createdBy === creatorId);
        setQuizzes(items);
      } catch (error) {
        console.error("Errore nel caricamento dei quiz:", error);
        setQuizzes([]);
      }
      setLoading(false);
    };
    fetchQuizzes();
  }, [creatorId, filter]);

  return (
    <div>
      {searchable && (
        <div style={{
          display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20,
          padding: "14px 16px", background: "#fff",
          border: "2.5px solid var(--ink)", borderRadius: "var(--radius,12px)",
          boxShadow: "3px 3px 0 0 var(--ink)",
        }}>
          <input
            type="search"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Cerca per argomento..."
            style={{
              flex: "1 1 220px", minWidth: 200,
              fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16,
              padding: "10px 14px", border: "2px solid var(--ink)",
              borderRadius: 10, background: "var(--cream,#f3f0e7)",
            }}
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{
              fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 15,
              padding: "10px 14px", border: "2px solid var(--ink)",
              borderRadius: 10, background: "#fff", cursor: "pointer",
            }}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento quiz...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Nessun quiz trovato</div>
          <p className="empty-message">
            {topic || difficulty ? "Prova a modificare i filtri." : "Non ci sono quiz da mostrare al momento."}
          </p>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map((quiz, idx) => (
            <article key={quiz.id} className="quiz-card">
              <Link
                to={`/quizzes/${quiz.id}`}
                className={`quiz-card-header ${COVER_CLASSES[idx % COVER_CLASSES.length]}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <span className="quiz-ai-badge">AI</span>
              </Link>

              <div className="quiz-card-content">
                <Link to={`/quizzes/${quiz.id}`} style={{ textDecoration: "none", color: "var(--ink)" }}>
                  <h3 className="quiz-title">{quiz.title}</h3>
                </Link>
                <p className="quiz-description">
                  {DIFFICULTY_LABEL[quiz.difficulty] || quiz.difficulty} · {quiz.numQuestions} domande
                </p>
                {quiz.createdByUsername && (
                  <div style={{ marginTop: 6 }}>
                    <Link
                      to={`/profile/${quiz.createdByUsername}`}
                      style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700,
                        color: "var(--ink-soft)", textDecoration: "none",
                      }}
                    >
                      @{quiz.createdByUsername}
                    </Link>
                  </div>
                )}
                {quiz.tags?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {quiz.tags.slice(0, 3).map((t) => (
                      <span key={t} style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
                        background: "var(--cream,#f3f0e7)", border: "1.5px solid var(--ink)",
                        borderRadius: 100, padding: "2px 8px",
                      }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="quiz-card-actions">
                <Link to={`/quizzes/${quiz.id}`} className="btn btn-primary btn-play">
                  Apri quiz
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
