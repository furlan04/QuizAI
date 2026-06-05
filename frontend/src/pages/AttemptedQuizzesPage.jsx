import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getUserSettings } from "../services/UserService";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Chip from "../components/ui/Chip";
import Spinner from "../components/ui/Spinner";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function AttemptedQuizzesPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const loadAttempts = useCallback(async (isActive = () => true) => {
    try {
      const profile = await getUserSettings();
      if (isActive()) setAttempts(profile?.attempts || []);
    } catch {
      if (isActive()) setAttempts([]);
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadAttempts(() => active);
    return () => { active = false; };
  }, [loadAttempts]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">
          Quiz che hai provato
        </h1>
        <p className="text-ink-soft mt-1">Apri un quiz per vederne il dettaglio</p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner />
          <p className="text-ink-soft">Caricamento quiz provati…</p>
        </div>
      ) : attempts.length === 0 ? (
        <Card className="text-center p-10">
          <div className="font-display font-extrabold text-xl mb-2">Nessun quiz provato</div>
          <p className="text-ink-soft mb-5">Gioca il tuo primo quiz per vederlo qui.</p>
          <Button as={Link} to="/quizzes">Esplora quiz</Button>
        </Card>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {attempts.map((a) => (
            <Card key={a.quizId} className="flex flex-col">
              <Link
                to={`/quizzes/${a.quizId}`}
                className="block h-24 bg-lime relative no-underline"
                style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,.08) 0 12px, transparent 12px 28px)" }}
              >
                <div className="absolute top-3 left-3">
                  <Chip tone="ink">{a.score} pt</Chip>
                </div>
              </Link>

              <div className="p-5 flex-1">
                <Link to={`/quizzes/${a.quizId}`} className="no-underline text-ink">
                  <h3 className="font-display font-extrabold text-lg leading-tight hover:underline">
                    {a.quizTitle || "Quiz"}
                  </h3>
                </Link>
                <p className="text-xs text-ink-soft mt-2">Completato il {formatDate(a.completedAt)}</p>
              </div>

              <div className="px-5 pb-5">
                <Button as={Link} to={`/quizzes/${a.quizId}`} fullWidth>
                  Apri quiz
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
