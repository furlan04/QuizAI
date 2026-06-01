// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, isLoggedIn }) {
  // Se l'utente non è loggato, reindirizza alla pagina di login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  // Se è loggato, mostra il componente figlio
  return children;
}