import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** Permette il rendering solo a utenti autenticati, altrimenti redirect a /login. */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
