// src/components/PublicRoute.jsx
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children, isLoggedIn }) {
  // Se l'utente è già loggato, reindirizza ai quiz
  if (isLoggedIn) {
    return <Navigate to="/quizzes" replace />;
  }
  
  // Se non è loggato, mostra il componente (login/register)
  return children;
}