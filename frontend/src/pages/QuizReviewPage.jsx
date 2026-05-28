// src/components/QuizReview.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAttemptReview } from "../services/QuizAttemptService";
import { getAuthToken } from "../services/CommonService";

export default function QuizReviewPage() {
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { attemptId } = useParams();

  useEffect(() => {
    const fetchReview = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Token non trovato");
        }

        const data = await getAttemptReview(attemptId, token);
        setReviewData(data);
      } catch (err) {
        console.error("Errore nel caricamento della revisione:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchReview();
    }
  }, [attemptId]);

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

  const getAnswerStatus = (question) => {
    if (question.isCorrect) {
      return {
        icon: '+',
        class: 'text-success',
        badge: 'bg-success bg-opacity-10 text-success',
        text: 'Corretta'
      };
    } else {
      return {
        icon: 'x',
        class: 'text-danger',
        badge: 'bg-danger bg-opacity-10 text-danger',
        text: 'Sbagliata'
      };
    }
  };

  const getOptionClass = (question, optionIndex) => {
    if (optionIndex === question.correctAnswerIndex) {
      return 'border-success bg-success bg-opacity-10';
    } else if (optionIndex === question.selectedAnswerIndex && !question.isCorrect) {
      return 'border-danger bg-danger bg-opacity-10';
    }
    return 'border-light';
  };

  const getOptionIcon = (question, optionIndex) => {
    if (optionIndex === question.correctAnswerIndex) {
      return '✓';
    } else if (optionIndex === question.selectedAnswerIndex && !question.isCorrect) {
      return '✗';
    }
    return '';
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < reviewData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Caricamento revisione...</span>
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
          <p>Si è verificato un errore nel caricamento della revisione: {error}</p>
          <hr />
          <Link to="/quizzes" className="btn btn-outline-danger">
            ← Torna ai Quiz
          </Link>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Nessun dato disponibile</h4>
          <p>Non è possibile caricare i dati della revisione.</p>
          <hr />
          <Link to="/quizzes" className="btn btn-outline-warning">
            ← Torna ai Quiz
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = reviewData.questions[currentQuestionIndex];
  const answerStatus = getAnswerStatus(currentQuestion);

  return (
    <div className="container my-5">
      {/* Header Section */}
      <div className="row align-items-center mb-5">
        <div className="col-lg-8">
          <h1 className="display-5 fw-bold text-primary mb-2">Revisione Quiz</h1>
          <p className="lead text-muted mb-0">
            Analizza le tue risposte e impara dai tuoi errori
          </p>
        </div>
        <div className="col-lg-4 text-lg-end">
          <Link to={`/attempts/${reviewData.quizId}`} className="btn btn-outline-primary">
            ← Torna ai Tentativi
          </Link>
        </div>
      </div>

      {/* Quiz Summary */}
      <div className="row mb-5">
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-primary bg-opacity-10 text-center py-3">
            <div className="card-body">
              <h3 className="text-primary fw-bold mb-1">{reviewData.score}</h3>
              <p className="text-muted small mb-0">Punteggio</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-success bg-opacity-10 text-center py-3">
            <div className="card-body">
              <h3 className="text-success fw-bold mb-1">{reviewData.percentage}%</h3>
              <p className="text-muted small mb-0">Percentuale</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-info bg-opacity-10 text-center py-3">
            <div className="card-body">
              <h3 className="text-info fw-bold mb-1">{reviewData.totalQuestions}</h3>
              <p className="text-muted small mb-0">Domande totali</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-secondary bg-opacity-10 text-center py-3">
            <div className="card-body">
              <h3 className="text-secondary fw-bold mb-1">{formatDate(reviewData.completedAt)}</h3>
              <p className="text-muted small mb-0">Completato il</p>
            </div>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <button 
              onClick={prevQuestion} 
              disabled={currentQuestionIndex === 0}
              className="btn btn-outline-primary"
            >
              ← Domanda precedente
            </button>
            
            <div className="text-center">
              <span className="badge bg-primary fs-6 px-3 py-2">
                Domanda {currentQuestionIndex + 1} di {reviewData.questions.length}
              </span>
            </div>
            
            <button 
              onClick={nextQuestion} 
              disabled={currentQuestionIndex === reviewData.questions.length - 1}
              className="btn btn-outline-primary"
            >
              Domanda successiva →
            </button>
          </div>
        </div>
      </div>

      {/* Question Display */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark">
              Domanda {currentQuestion.questionOrder}
            </h5>
            <span className={`badge rounded-pill px-3 py-2 ${answerStatus.badge}`}>
              {answerStatus.icon} {answerStatus.text}
            </span>
          </div>
        </div>
        <div className="card-body p-4">
          <h6 className="mb-4 text-dark">{currentQuestion.questionText}</h6>
          
          <div className="row">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="col-12 mb-3">
                <div className={`p-3 border rounded-3 ${getOptionClass(currentQuestion, index)}`}>
                  <div className="d-flex align-items-center">
                    <span className="fw-bold me-3 text-muted">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="flex-grow-1">{option}</span>
                    <span className="ms-2 fs-5">{getOptionIcon(currentQuestion, index)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Answer Explanation */}
          <div className="mt-4 p-3 bg-light rounded-3">
            <h6 className="text-primary mb-2">Analisi della risposta:</h6>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-1">
                  <strong>La tua risposta:</strong> 
                  <span className={`ms-2 ${currentQuestion.isCorrect ? 'text-success' : 'text-danger'}`}>
                    {String.fromCharCode(65 + currentQuestion.selectedAnswerIndex)}. {currentQuestion.options[currentQuestion.selectedAnswerIndex]}
                  </span>
                </p>
              </div>
              <div className="col-md-6">
                <p className="mb-1">
                  <strong>Risposta corretta:</strong> 
                  <span className="ms-2 text-success">
                    {String.fromCharCode(65 + currentQuestion.correctAnswerIndex)}. {currentQuestion.options[currentQuestion.correctAnswerIndex]}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="progress" style={{height: '10px'}}>
            <div 
              className="progress-bar bg-primary" 
              style={{width: `${((currentQuestionIndex + 1) / reviewData.questions.length) * 100}%`}}
            ></div>
          </div>
          <div className="text-center mt-2">
            <small className="text-muted">
              Progresso: {currentQuestionIndex + 1} di {reviewData.questions.length} domande
            </small>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="row">
        <div className="col-12 text-center">
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to={`/quiz/${reviewData.quizId}`} className="btn btn-primary btn-lg">
              Gioca di nuovo
            </Link>
            <Link to={`/attempts/${reviewData.quizId}`} className="btn btn-outline-primary btn-lg">
              Torna ai tentativi
            </Link>
            <Link to="/quizzes" className="btn btn-outline-secondary btn-lg">
              Torna ai quiz
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
