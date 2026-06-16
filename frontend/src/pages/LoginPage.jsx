import { useState, useEffect, useRef, useReducer } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, googleLogin, resendConfirmation } from "../services/AuthService";
import { AuthErrorCodes } from "../services/AuthErrorCodes";
import { getConfig } from "../config/config";
import { useAuth } from "../auth/AuthContext";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";

export default function LoginPage() {
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();
  const googleClientId = getConfig("GOOGLE_CLIENT_ID");
  const googleBtnRef = useRef(null);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  // Stato di richiesta/errore (login + reinvio conferma) raggruppato in un reducer.
  const [status, setStatus] = useReducer((s, patch) => ({ ...s, ...patch }), {
    error: "", errorCode: null, loading: false, resendMsg: "", resendBusy: false,
  });
  const { error, errorCode, loading, resendMsg, resendBusy } = status;

  const needsEmailConfirmation = errorCode === AuthErrorCodes.EmailNotConfirmed;

  // Inizializza il bottone Google quando lo script è caricato
  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;

    let retryTimer;
    let cancelled = false;

    const onCredential = async (response) => {
      setStatus({ error: "", errorCode: null, loading: true });
      try {
        const res = await googleLogin(response.credential);
        if (res.success) {
          setAuth(res.user);
          navigate("/");
        } else {
          setStatus({ error: res.message || "Login Google fallito", errorCode: res.code || null });
        }
      } catch {
        setStatus({ error: "Errore di connessione al server" });
      } finally {
        setStatus({ loading: false });
      }
    };

    const tryInit = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id) { retryTimer = setTimeout(tryInit, 250); return; }
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: onCredential });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline", size: "large", text: "signin_with", shape: "rectangular", width: 320,
      });
    };
    tryInit();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [googleClientId, setAuth, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus({ error: "", errorCode: null, resendMsg: "", loading: true });
    try {
      const result = await login(email, password);
      if (result.success) {
        setAuth(result.user);
        navigate("/");
      } else {
        setStatus({ error: result.message || "Errore login", errorCode: result.code || null });
      }
    } catch {
      setStatus({ error: "Errore di connessione al server" });
    } finally {
      setStatus({ loading: false });
    }
  };

  const handleResend = async () => {
    setStatus({ resendBusy: true, resendMsg: "" });
    const res = await resendConfirmation(email);
    setStatus({
      resendBusy: false,
      resendMsg: res.success ? "Email di conferma inviata." : "Errore nell'invio. Riprova più tardi.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card shadow="lg" className="p-8">
          <header className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-sm bg-ink text-lime grid place-items-center font-display font-extrabold text-xl shadow-hard">
                Q
              </div>
              <span className="font-display font-extrabold text-xl">QuizAI</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl">Bentornato!</h1>
            <p className="text-ink-soft text-sm mt-1">Accedi al tuo account per continuare</p>
          </header>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              type="email" label="Email"
              placeholder="nome@dominio.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email"
            />
            <Input
              type="password" label="Password"
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password"
            />
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-0.5 bg-ink/15" />
            <span className="text-xs font-mono font-bold text-ink-soft uppercase">oppure</span>
            <div className="flex-1 h-0.5 bg-ink/15" />
          </div>

          {googleClientId ? (
            <div ref={googleBtnRef} className="flex justify-center mb-4" />
          ) : (
            <p className="text-xs text-ink-soft text-center mb-4">Login Google non configurato.</p>
          )}

          <p className="text-center text-sm text-ink-soft">
            Non hai un account?{" "}
            <Link to="/register" className="font-bold text-violet hover:underline">
              Registrati qui
            </Link>
          </p>

          {error && (
            <div className="mt-4">
              <Alert variant="error">{error}</Alert>
              {needsEmailConfirmation && email && (
                <div className="mt-3 text-center">
                  <Button variant="outline" size="sm" onClick={handleResend} disabled={resendBusy} fullWidth>
                    {resendBusy ? "Invio in corso..." : "Reinvia email di conferma"}
                  </Button>
                  {resendMsg && <p className="mt-2 text-xs text-ink-soft">{resendMsg}</p>}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
