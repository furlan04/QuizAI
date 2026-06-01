import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getQuizById } from "../services/QuizService";
import { getLeaderboard, getMyAttempts } from "../services/QuizAttemptService";
import { getProfileByUserId } from "../services/UserService";
import { getAuthToken, getCurrentUser } from "../services/CommonService";

const DIFFICULTY_LABEL = { easy: "Facile", medium: "Medio", hard: "Difficile" };

const formatDate = (d) =>
  new Date(d).toLocaleDateString("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

const getInitials = (s) => (s ? s.slice(0, 2).toUpperCase() : "?");

export default function QuizDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = getCurrentUser();

  const [quiz, setQuiz] = useState(null);
  const [creatorUsername, setCreatorUsername] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myAttempt, setMyAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const quizData = await getQuizById(id, token);

        if (quizData?.generating || quizData?.status === "generating") {
          setError("Quiz ancora in generazione. Riprova tra qualche secondo.");
          setQuiz(null);
          return;
        }
        if (quizData?.status === "failed" || quizData?.error) {
          setError(quizData.error || "Quiz non disponibile.");
          setQuiz(null);
          return;
        }

        setQuiz(quizData);

        // Risolvi username del creatore: campo diretto, o fallback via userId per i quiz vecchi
        let username = quizData.createdByUsername || null;
        if (!username && quizData.createdBy) {
          const profile = await getProfileByUserId(quizData.createdBy, token).catch(() => null);
          if (profile?.username) username = profile.username;
        }
        setCreatorUsername(username);

        // Leaderboard e tentativo personale in parallelo (best-effort)
        const [lb, attempt] = await Promise.allSettled([
          getLeaderboard(id, token),
          getMyAttempts(id, token),
        ]);
        if (lb.status === "fulfilled" && Array.isArray(lb.value)) setLeaderboard(lb.value);
        if (attempt.status === "fulfilled" && attempt.value?.answers) setMyAttempt(attempt.value);
      } catch (err) {
        setError(err?.message || "Errore nel caricamento del quiz");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Caricamento quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="quiz-list-container">
        <div className="error-state">
          <div className="error-title">{error || "Quiz non trovato"}</div>
          <Link to="/quizzes" className="btn btn-primary" style={{ marginTop: 16 }}>
            Torna ai Quiz
          </Link>
        </div>
      </div>
    );
  }

  const topLeaderboard = leaderboard.slice(0, 5);
  const myAttemptScore = myAttempt ? myAttempt.score : null;
  const myAttemptTotal = myAttempt ? myAttempt.answers.length : null;

  return (
    <div className="quiz-list-container" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{
        background: "#fff", border: "2.5px solid var(--ink)",
        borderRadius: "var(--radius-lg,16px)", boxShadow: "var(--shadow-hard-lg)",
        overflow: "hidden",
      }}>
        <div style={{ height: 10, background: "var(--violet,#7c5cff)" }} />
        <div style={{ padding: "24px 28px" }}>
          <div style={{
            display: "inline-block", fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase",
            background: "var(--lime,#d6f25b)", border: "2px solid var(--ink)",
            borderRadius: 100, padding: "3px 10px", marginBottom: 14,
          }}>
            Quiz AI
          </div>
          <h1 style={{
            fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800,
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)", lineHeight: 1.1,
            letterSpacing: "-.02em", margin: "0 0 12px",
          }}>
            {quiz.title}
          </h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            <span className="quiz-meta-chip">{DIFFICULTY_LABEL[quiz.difficulty] || quiz.difficulty}</span>
            <span className="quiz-meta-chip">{quiz.numQuestions} domande</span>
            <span className="quiz-meta-chip">{formatDate(quiz.createdAt)}</span>
          </div>
          {quiz.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
              {quiz.tags.map((t) => (
                <span key={t} style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700,
                  background: "var(--cream,#f3f0e7)", border: "1.5px solid var(--ink)",
                  borderRadius: 100, padding: "3px 9px",
                }}>{t}</span>
              ))}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={() => navigate(`/quiz/${id}`)}
            style={{ fontSize: 17, padding: "14px 26px" }}
          >
            Gioca ora
          </button>
        </div>
      </div>

      {/* Card creatore */}
      {creatorUsername && (
        <Link
          to={`/profile/${creatorUsername}`}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 18px", background: "#fff",
            border: "2.5px solid var(--ink)", borderRadius: "var(--radius,12px)",
            boxShadow: "3px 3px 0 0 var(--ink)", textDecoration: "none",
            color: "var(--ink)",
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--sky,#a3c9ff)", border: "2.5px solid var(--ink)",
            display: "grid", placeItems: "center",
            fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 16,
          }}>
            {getInitials(creatorUsername)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Creato da</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{creatorUsername}</div>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700 }}>
            Vai al profilo →
          </span>
        </Link>
      )}

      {/* Tuo tentativo */}
      {myAttempt && (
        <div style={{
          padding: "16px 20px", background: "var(--butter,#fff3a3)",
          border: "2.5px solid var(--ink)", borderRadius: "var(--radius,12px)",
          boxShadow: "3px 3px 0 0 var(--ink)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700 }}>Il tuo ultimo tentativo</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              {myAttemptScore} / {myAttemptTotal} corrette
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {formatDate(myAttempt.completedAt)}
            </div>
          </div>
          <Link to={`/review/${id}`} className="btn btn-outline">Rivedi risposte</Link>
        </div>
      )}

      {/* Leaderboard accorciata */}
      <div style={{
        background: "#fff", border: "2.5px solid var(--ink)",
        borderRadius: "var(--radius,12px)", boxShadow: "3px 3px 0 0 var(--ink)",
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 18px", borderBottom: "2px solid var(--ink)",
        }}>
          <h3 style={{ margin: 0, fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800 }}>
            🏆 Classifica
          </h3>
          {leaderboard.length > 5 && (
            <Link to={`/leaderboard/${id}`} style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700,
              color: "var(--ink)", textDecoration: "underline",
            }}>
              Vedi tutta →
            </Link>
          )}
        </div>
        {topLeaderboard.length === 0 ? (
          <div style={{ padding: "20px", color: "var(--ink-soft)", textAlign: "center" }}>
            Nessuno ha ancora completato questo quiz. Sii il primo!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {topLeaderboard.map((entry, idx) => {
              const isMe = me && entry.username === me.username;
              return (
                <div
                  key={idx}
                  style={{
                    display: "grid", gridTemplateColumns: "40px 1fr auto",
                    alignItems: "center", gap: 12,
                    padding: "10px 18px",
                    background: isMe ? "var(--lime,#d6f25b)" : "transparent",
                    borderBottom: idx < topLeaderboard.length - 1 ? "1px solid rgba(26,23,38,.1)" : "none",
                  }}
                >
                  <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 16 }}>
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {entry.username}{isMe && <small style={{ marginLeft: 6, color: "var(--ink-soft)" }}>(tu)</small>}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 16 }}>
                    {entry.score}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
