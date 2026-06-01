import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { confirmEmail } from "../services/AuthService";

export default function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const userId = params.get("userId");
    const token  = params.get("token");
    if (!userId || !token) {
      setStatus("error");
      setMessage("Link di conferma non valido.");
      return;
    }
    (async () => {
      const res = await confirmEmail(userId, token);
      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(res.message || "Conferma fallita.");
      }
    })();
  }, [params]);

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Conferma email</h1>

            {status === "loading" && (
              <>
                <div className="loading-spinner" />
                <p className="auth-subtitle">Sto confermando il tuo account...</p>
              </>
            )}

            {status === "success" && (
              <>
                <p className="auth-subtitle">Email confermata. Ora puoi accedere.</p>
                <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>
                  Vai al login
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <p className="auth-subtitle">{message}</p>
                <Link to="/register" className="btn btn-outline" style={{ marginTop: 16 }}>
                  Torna alla registrazione
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
