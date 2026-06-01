import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, googleLogin, resendConfirmation } from "../services/AuthService";
import { AuthErrorCodes } from "../services/AuthErrorCodes";
import { getConfig } from "../config/config";

export default function LoginPage({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const googleBtnRef = useRef(null);

  const needsEmailConfirmation = errorCode === AuthErrorCodes.EmailNotConfirmed;

  const handleResend = async () => {
    setResendBusy(true);
    setResendMsg("");
    const res = await resendConfirmation(email);
    setResendBusy(false);
    setResendMsg(res.success
      ? "Email di conferma inviata. Controlla la tua casella."
      : "Errore nell'invio. Riprova più tardi.");
  };

  const navigate = useNavigate();
  const googleClientId = getConfig("GOOGLE_CLIENT_ID");

  // Inizializza il pulsante Google quando lo script è caricato
  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;

    const onCredential = async (response) => {
      setError(""); setErrorCode(null);
      setLoading(true);
      try {
        const res = await googleLogin(response.credential);
        if (res.success && res.token) {
          sessionStorage.setItem("jwt", res.token);
          if (setIsLoggedIn) setIsLoggedIn(true);
          navigate("/");
        } else {
          setError(res.message || "Login Google fallito");
          setErrorCode(res.code || null);
        }
      } catch {
        setError("Errore di connessione al server");
      } finally {
        setLoading(false);
      }
    };

    const tryInit = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(tryInit, 250);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: onCredential,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline", size: "large", text: "signin_with", shape: "rectangular", width: 320,
      });
    };
    tryInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setErrorCode(null);
    setResendMsg("");
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success && result.token) {
        sessionStorage.setItem("jwt", result.token);
        setToken(result.token);
        if (setIsLoggedIn) setIsLoggedIn(true);
        navigate("/");
      } else {
        setError(result.message || "Errore login");
        setErrorCode(result.code || null);
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

            {googleClientId ? (
              <div ref={googleBtnRef} style={{ display: "flex", justifyContent: "center", marginBottom: 16 }} />
            ) : (
              <div style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "center", marginBottom: 16 }}>
                Login Google non configurato.
              </div>
            )}

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

            {needsEmailConfirmation && email && (
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleResend}
                  disabled={resendBusy}
                  style={{ width: "100%" }}
                >
                  {resendBusy ? "Invio in corso..." : "Reinvia email di conferma"}
                </button>
                {resendMsg && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--ink-soft)" }}>
                    {resendMsg}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
