import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../services/AuthService";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 1;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[a-z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(calculatePasswordStrength(pwd));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (password !== confirmPassword) {
      setMessage("Le password non coincidono");
      setLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setMessage("La password deve essere più sicura");
      setLoading(false);
      return;
    }

    try {
      const result = await register(email, password);
      if (result.success) {
        setMessage("Registrazione avvenuta! Controlla la tua email per confermare.");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setPasswordStrength(0);
      } else {
        setMessage(result.message || "Errore durante la registrazione");
      }
    } catch (error) {
      setMessage("Errore di connessione al server");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    const texts = ["Molto debole", "Debole", "Discreta", "Buona", "Eccellente"];
    const colors = ["#f44336", "#ff9800", "#ffc107", "#4caf50", "#2e7d32"];
    return { text: texts[passwordStrength] || "", color: colors[passwordStrength] || "#f44336" };
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
            <h1 className="auth-title">Crea il tuo account</h1>
            <p className="auth-subtitle">Unisciti alla community di AI Quiz Network</p>
          </div>
          
          <div className="auth-form-container">
            <form onSubmit={handleRegister} className="auth-form">
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
                <div className="form-hint">
                  💡 Usa un'email valida per confermare il tuo account
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-container">
                  <div className="input-icon">🔒</div>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Crea una password sicura"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                {password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill" 
                        style={{ 
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: getPasswordStrengthText().color
                        }}
                      ></div>
                    </div>
                    <span 
                      className="strength-text"
                      style={{ color: getPasswordStrengthText().color }}
                    >
                      {getPasswordStrengthText().text}
                    </span>
                  </div>
                )}
                <div className="form-hint">
                  🔐 Almeno 8 caratteri, con maiuscole, minuscole, numeri e simboli
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Conferma Password</label>
                <div className="input-container">
                  <div className="input-icon">🔐</div>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Ripeti la password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <div className="form-hint error">
                    ❌ Le password non coincidono
                  </div>
                )}
                {confirmPassword && password === confirmPassword && (
                  <div className="form-hint success">
                    ✅ Le password coincidono
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-auth"
                disabled={loading || password !== confirmPassword || passwordStrength < 3}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Registrazione in corso...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✨</span>
                    Registrati
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>oppure</span>
            </div>

            <div className="auth-footer">
              <p className="auth-switch-text">
                Hai già un account? 
                <Link to="/login" className="auth-link">
                  Accedi qui
                </Link>
              </p>
            </div>

            {message && (
              <div className={`alert ${message.includes('successo') || message.includes('avvenuta') ? 'alert-success' : 'alert-info'}`}>
                <div className="alert-content">
                  <span className="alert-icon">
                    {message.includes('successo') || message.includes('avvenuta') ? '✅' : 'ℹ️'}
                  </span>
                  <span className="alert-text">{message}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
