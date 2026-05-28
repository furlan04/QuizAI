// src/components/Leaderboard.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getLeaderboard } from "../services/QuizAttemptService";
import { getAuthToken } from "../services/CommonService";

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { quizId } = useParams();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Token non trovato");
        }

        const data = await getLeaderboard(quizId, token);
        setLeaderboardData(data);
      } catch (err) {
        console.error("Errore nel caricamento della classifica:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchLeaderboard();
    }
  }, [quizId]);

  const getPositionIcon = (position) => {
    switch (position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${position}`;
    }
  };

  const getPositionClass = (position) => {
    switch (position) {
      case 1: return "bg-warning bg-opacity-10 text-warning";
      case 2: return "bg-secondary bg-opacity-10 text-secondary";
      case 3: return "bg-warning bg-opacity-25 text-warning";
      default: return "bg-light text-muted";
    }
  };

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

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Caricamento classifica...</span>
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
          <p>Si è verificato un errore nel caricamento della classifica: {error}</p>
          <hr />
          <Link to="/quizzes" className="btn btn-outline-danger">
            ← Torna ai Quiz
          </Link>
        </div>
      </div>
    );
  }

  if (!leaderboardData || !leaderboardData.entries || leaderboardData.entries.length === 0) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="mb-4">
            <span className="display-1 text-muted">🏆</span>
          </div>
          <h2 className="text-muted mb-3">Nessuna classifica disponibile</h2>
          <p className="text-muted mb-4">Questo quiz non ha ancora tentativi registrati.</p>
          <Link to="/quizzes" className="btn btn-primary">
            ← Torna ai Quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      {/* Header Section */}
      <div className="row align-items-center mb-5">
        <div className="col-lg-8">
          <h1 className="display-5 fw-bold text-primary mb-2">🏆 Classifica Quiz</h1>
          <p className="lead text-muted mb-0">
            Scopri chi ha ottenuto i migliori risultati
          </p>
        </div>
        <div className="col-lg-4 text-lg-end">
          <Link to="/quizzes" className="btn btn-outline-primary">
            ← Torna ai Quiz
          </Link>
        </div>
      </div>

      {/* Leaderboard Stats */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card border-0 bg-primary bg-opacity-10 text-center py-3">
            <div className="card-body">
              <h3 className="text-primary fw-bold mb-1">{leaderboardData.entries.length}</h3>
              <p className="text-muted mb-0">Partecipanti</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 bg-success bg-opacity-10 text-center py-3">
            <div className="card-body">
              <h3 className="text-success fw-bold mb-1">
                {Math.max(...leaderboardData.entries.map(entry => entry.score))}
              </h3>
              <p className="text-muted mb-0">Punteggio più alto</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 bg-info bg-opacity-10 text-center py-3">
            <div className="card-body">
              <h3 className="text-info fw-bold mb-1">
                {Math.round(leaderboardData.entries.reduce((acc, entry) => acc + entry.percentage, 0) / leaderboardData.entries.length)}%
              </h3>
              <p className="text-muted mb-0">Media percentuale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 py-3">
          <h5 className="mb-0 fw-bold text-dark">Risultati</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 ps-4" style={{width: '80px'}}>Posizione</th>
                  <th className="border-0">Utente</th>
                  <th className="border-0 text-center">Punteggio</th>
                  <th className="border-0 text-center">Percentuale</th>
                  <th className="border-0 text-center">Completato il</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.entries.map((entry, index) => (
                  <tr key={index} className={entry.isCurrentUser ? 'table-primary' : ''}>
                    <td className="ps-4">
                      <div className={`d-flex align-items-center justify-content-center rounded-circle ${getPositionClass(entry.position)}`} 
                           style={{width: '40px', height: '40px'}}>
                        <span className="fw-bold fs-6">
                          {getPositionIcon(entry.position)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="fw-bold text-dark me-2">
                          {entry.userName}
                        </span>
                        {entry.isCurrentUser && (
                          <span className="badge bg-primary bg-opacity-10 text-primary">
                            Tu
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="fw-bold fs-5 text-primary">{entry.score}</span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center">
                        <div className="progress me-2" style={{width: '60px', height: '8px'}}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{width: `${entry.percentage}%`}}
                          ></div>
                        </div>
                        <span className="fw-bold text-success">{entry.percentage}%</span>
                      </div>
                    </td>
                    <td className="text-center text-muted">
                      {formatDate(entry.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center mt-4">
        <p className="text-muted small">
          La classifica viene aggiornata in tempo reale. 
          Ultimo aggiornamento: {new Date().toLocaleString('it-IT')}
        </p>
      </div>
    </div>
  );
}
