import { useEffect, useState, useMemo, useReducer } from "react";
import { Link } from "react-router-dom";
import { getQuizzes } from "../services/QuizService";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Chip from "./ui/Chip";
import Spinner from "./ui/Spinner";

const COVERS = [
  "bg-violet",
  "bg-coral",
  "bg-lime",
  "bg-sky",
  "bg-butter",
  "bg-mint",
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
 *   - creatorId:    se valorizzato, filtra client-side per quel creatore
 *   - searchable:   se true (default), mostra la barra di ricerca/filtri
 *   - initialTopic: valore iniziale del topic
 */
export default function QuizList({ creatorId = null, searchable = true, initialTopic = "" }) {
  // Filtri di ricerca correlati raggruppati in un reducer.
  const [filters, setFilters] = useReducer((s, patch) => ({ ...s, ...patch }), {
    topic: initialTopic, debouncedTopic: initialTopic, difficulty: "",
  });
  const { topic, debouncedTopic, difficulty } = filters;
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setFilters({ debouncedTopic: topic.trim() }), 300);
    return () => clearTimeout(t);
  }, [topic]);

  const filter = useMemo(() => ({
    topic:      debouncedTopic || undefined,
    difficulty: difficulty     || undefined,
  }), [debouncedTopic, difficulty]);

  // Scarica dal server solo quando cambiano i filtri inviati al server.
  // creatorId NON è qui: filtra lato client, quindi non deve causare un re-fetch.
  useEffect(() => {
    let cancelled = false;
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const data = await getQuizzes(filter);
        if (!cancelled) setAllQuizzes(data?.items || []);
      } catch {
        if (!cancelled) setAllQuizzes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchQuizzes();
    return () => { cancelled = true; };
  }, [filter]);

  // Il filtro per creatore è una pura derivazione dei dati già scaricati:
  // si calcola durante il render, non si duplica nello stato.
  const quizzes = useMemo(
    () => (creatorId ? allQuizzes.filter((q) => q.createdBy === creatorId) : allQuizzes),
    [allQuizzes, creatorId],
  );

  return (
    <div>
      {searchable && (
        <Card className="flex flex-wrap gap-2.5 p-3.5 mb-5">
          <input
            type="search"
            aria-label="Cerca quiz per argomento"
            value={topic}
            onChange={(e) => setFilters({ topic: e.target.value })}
            placeholder="Cerca per argomento..."
            className="flex-1 min-w-[200px] font-display font-bold text-base
                       border-2 border-ink rounded-sm bg-cream
                       px-3.5 py-2.5
                       focus:outline-none focus:border-violet focus:bg-white"
          />
          <select
            aria-label="Filtra per difficoltà"
            value={difficulty}
            onChange={(e) => setFilters({ difficulty: e.target.value })}
            className="font-display font-bold text-sm
                       border-2 border-ink rounded-sm bg-white
                       px-3.5 py-2.5 cursor-pointer
                       focus:outline-none focus:border-violet"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner />
          <p className="text-ink-soft">Caricamento quiz…</p>
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="text-center p-10">
          <div className="font-display font-extrabold text-xl mb-2">Nessun quiz trovato</div>
          <p className="text-ink-soft">
            {topic || difficulty ? "Prova a modificare i filtri." : "Non ci sono quiz al momento."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, idx) => (
            <Card key={quiz.id} className="flex flex-col">
              <Link
                to={`/quizzes/${quiz.id}`}
                className={`block h-24 relative no-underline ${COVERS[idx % COVERS.length]}`}
                style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,.08) 0 12px, transparent 12px 28px)" }}
              >
                <div className="absolute top-3 left-3">
                  <Chip tone="ink">AI</Chip>
                </div>
              </Link>

              <div className="p-5 flex-1">
                <Link to={`/quizzes/${quiz.id}`} className="no-underline text-ink">
                  <h3 className="font-display font-extrabold text-lg leading-tight hover:underline">
                    {quiz.title}
                  </h3>
                </Link>
                <p className="text-xs text-ink-soft mt-1.5">
                  {DIFFICULTY_LABEL[quiz.difficulty] || quiz.difficulty} · {quiz.numQuestions} domande
                </p>
                {quiz.createdByUsername && (
                  <Link
                    to={`/profile/${quiz.createdByUsername}`}
                    className="inline-block mt-2 font-mono text-xs font-bold text-ink-soft hover:text-ink no-underline"
                  >
                    @{quiz.createdByUsername}
                  </Link>
                )}
                {quiz.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {quiz.tags.slice(0, 3).map((t) => (
                      <Chip key={t} size="sm">{t}</Chip>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                <Button as={Link} to={`/quizzes/${quiz.id}`} fullWidth>
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
