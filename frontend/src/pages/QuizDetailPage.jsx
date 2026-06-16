import { useEffect, useState, useReducer } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getQuizById, downloadAnkiDeck } from "../services/QuizService";
import { getLeaderboard, getMyAttempts } from "../services/QuizAttemptService";
import { getProfileByUserId } from "../services/UserService";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Chip from "../components/ui/Chip";
import Spinner from "../components/ui/Spinner";
import { Trophy, Medal, ArrowRight } from "../components/ui/Icon";

const DIFFICULTY_LABEL = { easy: "Facile", medium: "Medio", hard: "Difficile" };
// Colori medaglia oro / argento / bronzo per le prime tre posizioni.
const MEDAL_COLOR = ["#D4AF37", "#9CA3AF", "#CD7F32"];

const formatDate = (d) =>
  new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
const getInitials = (s) => (s ? s.slice(0, 2).toUpperCase() : "?");

export default function QuizDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  // Dati della pagina caricati insieme nello stesso effetto: raggruppati in un reducer.
  const [data, setData] = useReducer((s, patch) => ({ ...s, ...patch }), {
    quiz: null, creatorUsername: null, leaderboard: [], myAttempt: null,
  });
  const { quiz, creatorUsername, leaderboard, myAttempt } = data;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingAnki, setDownloadingAnki] = useState(false);

  const handleAnkiDownload = async () => {
    setDownloadingAnki(true);
    const res = await downloadAnkiDeck(id, quiz.title);
    if (!res.success) {
      alert(res.message);
    }
    setDownloadingAnki(false);
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError(null);
      try {
        const quizData = await getQuizById(id);
        if (quizData?.generating || quizData?.status === "generating") {
          setError("Quiz ancora in generazione. Riprova tra qualche secondo.");
          return;
        }
        if (quizData?.status === "failed" || quizData?.error) {
          setError(quizData.error || "Quiz non disponibile.");
          return;
        }
        setData({ quiz: quizData });

        let username = quizData.createdByUsername || null;
        if (!username && quizData.createdBy) {
          const profile = await getProfileByUserId(quizData.createdBy).catch(() => null);
          if (profile?.username) username = profile.username;
        }
        setData({ creatorUsername: username });

        const [lb, attempt] = await Promise.allSettled([
          getLeaderboard(id),
          getMyAttempts(id),
        ]);
        if (lb.status === "fulfilled" && Array.isArray(lb.value)) setData({ leaderboard: lb.value });
        if (attempt.status === "fulfilled" && attempt.value?.answers) setData({ myAttempt: attempt.value });
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
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-ink-soft">Caricamento quiz…</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Card className="p-8 text-center">
          <div className="font-display font-extrabold text-xl mb-4">{error || "Quiz non trovato"}</div>
          <Button as={Link} to="/quizzes">Torna ai Quiz</Button>
        </Card>
      </div>
    );
  }

  const topLeaderboard = leaderboard.slice(0, 5);
  const myAttemptTotal = myAttempt ? myAttempt.answers.length : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-5">

      {/* Header */}
      <Card shadow="lg">
        <div className="h-2.5 bg-violet" />
        <div className="p-7">
          <Chip tone="lime" className="mb-3.5">Quiz AI</Chip>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight tracking-tight mb-3">
            {quiz.title}
          </h1>

          <div className="flex flex-wrap gap-2.5 mb-4">
            <Chip mono={false}>{DIFFICULTY_LABEL[quiz.difficulty] || quiz.difficulty}</Chip>
            <Chip mono={false}>{quiz.numQuestions} domande</Chip>
            <Chip mono={false}>{formatDate(quiz.createdAt)}</Chip>
          </div>

          {quiz.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {quiz.tags.map((t) => <Chip key={t} size="sm">{t}</Chip>)}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <Button size="lg" onClick={() => navigate(`/quiz/${id}`)}>
              Gioca ora
            </Button>
            <Button size="lg" variant="outline" onClick={handleAnkiDownload} disabled={downloadingAnki}>
              {downloadingAnki ? "Esportazione..." : "Esporta in Anki"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Creatore */}
      {creatorUsername && (
        <Link to={`/profile/${creatorUsername}`} className="no-underline">
          <Card className="flex items-center gap-3.5 p-3.5 hover:bg-cream">
            <div className="w-11 h-11 rounded-full bg-sky border-3 border-ink grid place-items-center font-display font-extrabold text-base shrink-0">
              {getInitials(creatorUsername)}
            </div>
            <div className="flex-1">
              <div className="text-xs text-ink-soft">Creato da</div>
              <div className="font-extrabold text-base">{creatorUsername}</div>
            </div>
            <span className="font-mono text-xs font-bold inline-flex items-center gap-1">Vai al profilo <ArrowRight size={14} /></span>
          </Card>
        </Link>
      )}

      {/* Tuo tentativo */}
      {myAttempt && (
        <Card bg="bg-butter" className="p-5 flex justify-between items-center gap-3 flex-wrap">
          <div>
            <div className="text-xs text-ink-soft font-bold">Il tuo ultimo tentativo</div>
            <div className="font-display font-extrabold text-lg">
              {myAttempt.score} / {myAttemptTotal} corrette
            </div>
            <div className="text-xs text-ink-soft">{formatDate(myAttempt.completedAt)}</div>
          </div>
          <Button as={Link} to={`/review/${id}`} variant="outline">Rivedi risposte</Button>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <div className="flex justify-between items-center px-5 py-3.5 border-b-2 border-ink">
          <h3 className="font-display font-extrabold text-lg m-0 inline-flex items-center gap-2">
            <Trophy size={20} className="text-violet" /> Classifica
          </h3>
          {leaderboard.length > 5 && (
            <Link to={`/leaderboard/${id}`} className="font-mono text-xs font-bold underline inline-flex items-center gap-1">
              Vedi tutta <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {topLeaderboard.length === 0 ? (
          <div className="p-5 text-ink-soft text-center">
            Nessuno ha ancora completato questo quiz. Sii il primo!
          </div>
        ) : (
          <div className="flex flex-col">
            {topLeaderboard.map((entry, idx) => {
              const isMe = me && entry.username === me.username;
              return (
                <div
                  key={entry.username}
                  className={[
                    "grid grid-cols-[40px_1fr_auto] items-center gap-3 px-5 py-2.5",
                    isMe ? "bg-lime" : "",
                    idx < topLeaderboard.length - 1 ? "border-b border-ink/10" : "",
                  ].join(" ")}
                >
                  <span className="font-display font-extrabold text-base">
                    {idx < 3
                      ? <Medal size={20} style={{ color: MEDAL_COLOR[idx] }} />
                      : `#${idx + 1}`}
                  </span>
                  <span className="font-bold">
                    {entry.username}
                    {isMe && <small className="ml-1.5 text-ink-soft">(tu)</small>}
                  </span>
                  <span className="font-mono font-extrabold text-base">{entry.score}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
