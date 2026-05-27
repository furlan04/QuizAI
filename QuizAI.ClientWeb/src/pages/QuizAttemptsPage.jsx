// src/components/QuizAttempts.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMyAttempts } from "../services/QuizAttemptService";
import { getAuthToken } from "../services/CommonService";

export default function QuizAttemptsPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const { quizId } = useParams();

  useEffect(() => {
    const fetchAttempts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Token non trovato");
        }

        const data = await getMyAttempts(quizId, token);
        setAttempts(data);
        
        // Calcola statistiche generali
        if (data.length > 0) {
          const totalAttempts = data.length;
          const avgScore = data.reduce((acc, attempt) => acc + attempt.score, 0) / totalAttempts;
          const avgPercentage = data.reduce((acc, attempt) => acc + attempt.percentage, 0) / totalAttempts;
          const bestScore = Math.max(...data.map(attempt => attempt.score));
          const bestPercentage = Math.max(...data.map(attempt => attempt.percentage));
          
          setQuizInfo({
            totalAttempts,
            avgScore: Math.round(avgScore * 10) / 10,
            avgPercentage: Math.round(avgPercentage * 10) / 10,
            bestScore,
            bestPercentage,
            totalQuestions: data[0]?.totalQuestions || 0
          });
        }
      } catch (err) {
        console.error("Errore nel caricamento dei tentativi:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchAttempts();
    }
  }, [quizId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getScoreBadge = (percentage) => {
    if (percentage >= 80) return 'bg-success bg-opacity-10 text-success';
    if (percentage >= 60) return 'bg-warning bg-opacity-10 text-warning';
    return 'bg-danger bg-opacity-10 text-danger';
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Caricamento tentativi...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Errore nel caricamento</h4>
          <p>Si è verificato un errore nel caricamento dei tentativi: {error}</p>
          <hr />
          <Link to="/quizzes" className="btn btn-outline-danger">
            ← Torna ai Quiz
          </Link>
        </div>
      </div>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <h2 className="text-muted mb-3">Nessun tentativo trovato</h2>
          <p className="text-muted mb-4">Non hai ancora completato questo quiz.</p>
          <div className="d-flex gap-3 justify-content-center">
            <Link to={`/quiz/${quizId}`} className="btn btn-primary">
              Gioca ora
            </Link>
            <Link to="/quizzes" className="btn btn-outline-primary">
              Torna ai Quiz
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      {/* Header Section */}
      <div className="row align-items-center mb-5">
        <div className="col-lg-8">
          <h1 className="display-5 fw-bold text-primary mb-2">I Miei Tentativi</h1>
          <p className="lead text-muted mb-0">
            Monitora i tuoi progressi e migliora le tue performance
          </p>
        </div>
        <div className="col-lg-4 text-lg-end">
          <div className="d-flex gap-2 justify-content-lg-end">
            <Link to={`/quiz/${quizId}`} className="btn btn-primary">
              Gioca di nuovo
            </Link>
            <Link to="/quizzes" className="btn btn-outline-primary">
              Torna ai Quiz
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {quizInfo && (
        <div className="row mb-5">
          <div className="col-md-2 col-sm-4 mb-3">
            <div className="card border-0 bg-primary bg-opacity-10 text-center py-3">
              <div className="card-body">
                <h3 className="text-primary fw-bold mb-1">{quizInfo.totalAttempts}</h3>
                <p className="text-muted small mb-0">Tentativi</p>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-sm-4 mb-3">
            <div className="card border-0 bg-success bg-opacity-10 text-center py-3">
              <div className="card-body">
                <h3 className="text-success fw-bold mb-1">{quizInfo.bestScore}</h3>
                <p className="text-muted small mb-0">Miglior punteggio</p>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-sm-4 mb-3">
            <div className="card border-0 bg-warning bg-opacity-10 text-center py-3">
              <div className="card-body">
                <h3 className="text-warning fw-bold mb-1">{quizInfo.bestPercentage}%</h3>
                <p className="text-muted small mb-0">Miglior %</p>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-sm-4 mb-3">
            <div className="card border-0 bg-info bg-opacity-10 text-center py-3">
              <div className="card-body">
                <h3 className="text-info fw-bold mb-1">{quizInfo.avgScore}</h3>
                <p className="text-muted small mb-0">Media punteggio</p>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-sm-4 mb-3">
            <div className="card border-0 bg-secondary bg-opacity-10 text-center py-3">
              <div className="card-body">
                <h3 className="text-secondary fw-bold mb-1">{quizInfo.avgPercentage}%</h3>
                <p className="text-muted small mb-0">Media %</p>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-sm-4 mb-3">
            <div className="card border-0 bg-dark bg-opacity-10 text-center py-3">
              <div className="card-body">
                <h3 className="text-dark fw-bold mb-1">{quizInfo.totalQuestions}</h3>
                <p className="text-muted small mb-0">Domande totali</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attempts Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 py-3">
          <h5 className="mb-0 fw-bold text-dark">Cronologia Tentativi</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 ps-4">#</th>
                  <th className="border-0">Data Completamento</th>
                  <th className="border-0 text-center">Punteggio</th>
                  <th className="border-0 text-center">Percentuale</th>
                  <th className="border-0 text-center">Risultato</th>
                  <th className="border-0 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt, index) => (
                  <tr key={attempt.id}>
                    <td className="ps-4">
                      <span className="fw-bold text-muted">#{attempts.length - index}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="fw-bold text-dark me-2">
                          {formatDate(attempt.completedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="fw-bold fs-5 text-primary">{attempt.score}</span>
                      <span className="text-muted small d-block">
                        su {attempt.totalQuestions}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center">
                        <div className="progress me-2" style={{width: '60px', height: '8px'}}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{width: `${attempt.percentage}%`}}
                          ></div>
                        </div>
                        <span className={`fw-bold ${getScoreColor(attempt.percentage)}`}>
                          {attempt.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`badge rounded-pill px-3 py-2 ${getScoreBadge(attempt.percentage)}`}>
                        {attempt.percentage >= 80 ? 'Eccellente' :
                         attempt.percentage >= 60 ? 'Buono' : 'Da migliorare'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex gap-2 justify-content-center">
                        <Link to={`/quiz/${quizId}`} className="btn btn-outline-primary btn-sm">
                          Riprova
                        </Link>
                        <Link to={`/review/${attempt.id}`} className="btn btn-outline-info btn-sm">
                          Rivedi
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Progress Insights */}
      <div className="row mt-5">
        <div className="col-lg-8">
          <div className="card border-0 bg-light bg-opacity-50">
            <div className="card-body">
              <h5 className="card-title text-primary mb-3">Suggerimenti per migliorare</h5>
              <ul className="list-unstyled mb-0">
                {quizInfo && quizInfo.avgPercentage < 80 && (
                  <li className="mb-2">
                    La tua media è del {quizInfo.avgPercentage}%. Prova a rivedere le domande sbagliate.
                  </li>
                )}
                {quizInfo && quizInfo.totalAttempts < 3 && (
                  <li className="mb-2">
                    Hai fatto solo {quizInfo.totalAttempts} tentativo{quizInfo.totalAttempts > 1 ? 'i' : 'o'}.
                    Più tentativi ti aiuteranno a migliorare!
                  </li>
                )}
                {quizInfo && quizInfo.bestPercentage >= 90 && (
                  <li className="mb-2">
                    Ottimo lavoro! Hai già raggiunto il {quizInfo.bestPercentage}%. Continua così!
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 bg-primary bg-opacity-10">
            <div className="card-body text-center">
              <h6 className="text-primary mb-2">Prossimo obiettivo</h6>
              {quizInfo && (
                <p className="mb-2">
                  {quizInfo.bestPercentage < 100 ? 
                    `Raggiungi il ${Math.min(100, quizInfo.bestPercentage + 10)}%` : 
                    'Hai già raggiunto il 100%!'
                  }
                </p>
              )}
              <Link to={`/quiz/${quizId}`} className="btn btn-primary btn-sm">
                Sfida te stesso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
