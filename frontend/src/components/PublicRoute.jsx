import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** Rotte pubbliche (login/register): se l'utente è già loggato manda a /. */
export default function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}
