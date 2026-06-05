import { useState, useReducer } from "react";
import { Link } from "react-router-dom";
import { register } from "../services/AuthService";
import { Brain, User, Mail, Lock, ShieldCheck, Info, Check, X, UserPlus } from "../components/ui/Icon";

const calculatePasswordStrength = (pwd) => {
  let strength = 0;
  if (pwd.length >= 8) strength += 1;
  if (/[A-Z]/.test(pwd)) strength += 1;
  if (/[a-z]/.test(pwd)) strength += 1;
  if (/[0-9]/.test(pwd)) strength += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
  return strength;
};

export default function RegisterPage() {
  // Campi del form raggruppati in un reducer.
  const [form, setForm] = useReducer((s, patch) => ({ ...s, ...patch }), {
    username: "", email: "", password: "", confirmPassword: "",
  });
  const { username, email, password, confirmPassword } = form;
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setForm({ password: pwd });
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

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setMessage("Username: 3-20 caratteri, solo lettere, numeri e underscore");
      setLoading(false);
      return;
    }

    try {
      const result = await register(username, email, password);
      if (result.success) {
        setMessage(result.message || "Registrazione completata. Controlla la tua email per confermare l'account.");
        setForm({ username: "", email: "", password: "", confirmPassword: "" });
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
                <span className="brand-icon"><Brain size={22} /></span>
              </div>
              <span className="brand-text">AI Quiz</span>
            </div>
            <h1 className="auth-title">Crea il tuo account</h1>
            <p className="auth-subtitle">Unisciti alla community di AI Quiz Network</p>
          </div>
          
          <div className="auth-form-container">
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="register-username">Username</label>
                <div className="input-container">
                  <div className="input-icon"><User size={18} /></div>
                  <input
                    id="register-username"
                    type="text"
                    className="form-control"
                    placeholder="es. mario_rossi"
                    value={username}
                    onChange={(e) => setForm({ username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-hint">
                  <Info size={14} /> 3-20 caratteri: lettere, numeri e underscore
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-email">Email</label>
                <div className="input-container">
                  <div className="input-icon"><Mail size={18} /></div>
                  <input
                    id="register-email"
                    type="email"
                    className="form-control"
                    placeholder="es. nome@dominio.com"
                    value={email}
                    onChange={(e) => setForm({ email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-hint">
                  <Info size={14} /> Usa un'email valida
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-password">Password</label>
                <div className="input-container">
                  <div className="input-icon"><Lock size={18} /></div>
                  <input
                    id="register-password"
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
                  <Info size={14} /> Almeno 8 caratteri, con maiuscole, minuscole, numeri e simboli
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-confirm">Conferma Password</label>
                <div className="input-container">
                  <div className="input-icon"><ShieldCheck size={18} /></div>
                  <input
                    id="register-confirm"
                    type="password"
                    className="form-control"
                    placeholder="Ripeti la password"
                    value={confirmPassword}
                    onChange={(e) => setForm({ confirmPassword: e.target.value })}
                    required
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <div className="form-hint error">
                    <X size={14} /> Le password non coincidono
                  </div>
                )}
                {confirmPassword && password === confirmPassword && (
                  <div className="form-hint success">
                    <Check size={14} /> Le password coincidono
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
                    Registrazione in corso…
                  </>
                ) : (
                  <>
                    <span className="btn-icon"><UserPlus size={18} /></span>
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
              <div className={`alert ${/successo|avvenuta|completata/i.test(message) ? 'alert-success' : 'alert-info'}`}>
                <div className="alert-content">
                  <span className="alert-icon">
                    {/successo|avvenuta|completata/i.test(message) ? <Check size={18} /> : <Info size={18} />}
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
