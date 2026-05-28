import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/AuthService";

export default function LoginPage({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const result = await login(email, password);

      if (result.success && result.token) {
        sessionStorage.setItem("jwt", result.token);
        setToken(result.token);

        if (setIsLoggedIn) {
          setIsLoggedIn(true);
        }

        navigate("/");
      } else {
        setError(result.message || "Errore login");
      }
    } catch (err) {
      console.error(err);
      setError("Errore di connessione al server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-gradient"></div>
        <div className="auth-pattern"></div>
      </div>
      
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="brand-logo">
                <span className="brand-icon">🧠</span>
              </div>
              <span className="brand-text">AI Quiz</span>
            </div>
            <h1 className="auth-title">Bentornato!</h1>
            <p className="auth-subtitle">Accedi al tuo account per continuare</p>
          </div>
          
          <div className="auth-form-container">
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-container">
                  <div className="input-icon">📧</div>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="es. nome@dominio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-container">
                  <div className="input-icon">🔒</div>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Inserisci la password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-auth"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Accesso in corso...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    Accedi
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>oppure</span>
            </div>

            <div className="auth-footer">
              <p className="auth-switch-text">
                Non hai un account? 
                <Link to="/register" className="auth-link">
                  Registrati qui
                </Link>
              </p>
            </div>

            {token && (
              <div className="alert alert-success">
                <div className="alert-content">
                  <span className="alert-icon">✅</span>
                  <span className="alert-text">Login effettuato con successo!</span>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <div className="alert-content">
                  <span className="alert-icon">❌</span>
                  <span className="alert-text">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
