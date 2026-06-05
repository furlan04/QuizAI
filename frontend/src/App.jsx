// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import QuizCreatePage from "./pages/QuizCreatePage";
import QuizPlayPage from "./pages/QuizPlayPage";
import HomePage from "./pages/HomePage";
import FriendshipRequestsPage from "./pages/FriendshipRequestsPage";
import FriendsListPage from "./pages/FriendsListPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import QuizAttemptsPage from "./pages/QuizAttemptsPage";
import QuizReviewPage from "./pages/QuizReviewPage";
import SettingsPage from "./pages/SettingsPage";
import FYPage from "./pages/FYPage";
import ProfilePage from "./pages/ProfilePage";
import QuizListPage from "./pages/QuizListPage";
import QuizDetailPage from "./pages/QuizDetailPage";
import LikedQuizzesPage from "./pages/LikedQuizzesPage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";
import NotificationsPage from "./pages/NotificationsPage";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import "./styles/App.css";
import AttemptedQuizPage from "./pages/AttemptedQuizzesPage";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}

function AppShell() {
  const { isAuthenticated: isLoggedIn, logout } = useAuth();

  return (
    <div className={`app-container ${isLoggedIn ? 'authenticated' : 'public'}`}>
      <Navbar />
      <main className="main-content">
        <Routes>
        {/* Rotta home - reindirizza ai quiz se loggato */}
        <Route 
          path="/" 
          element={
            isLoggedIn ? (
              <ProtectedRoute>
                <FYPage />
              </ProtectedRoute>
            ) : (
              <HomePage />
            )
          } 
        />
        
        {/* Rotte pubbliche - accessibili solo se NON loggati */}
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Conferma email (pubblica, accessibile da link in email) */}
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />

        {/* Rotte per i quiz */}
        <Route 
          path="/quizzes" 
          element={
            <ProtectedRoute>
              <QuizListPage />
            </ProtectedRoute>
          } 
        />
        {/* Lista quiz di un utente specifico (rotta separata per evitare collisione con il dettaglio) */}
        <Route
          path="/users/:userId/quizzes"
          element={
            <ProtectedRoute>
              <QuizListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/create"
          element={
            <ProtectedRoute>
              <QuizCreatePage/>
            </ProtectedRoute>
          }
        />
        {/* Dettaglio di un quiz specifico */}
        <Route
          path="/quizzes/:id"
          element={
            <ProtectedRoute>
              <QuizDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:id"
          element={
            <ProtectedRoute>
              <QuizPlayPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotta per la classifica del quiz */}
        <Route 
          path="/leaderboard/:quizId" 
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Rotta per i tentativi del quiz */}
        <Route 
          path="/attempts/:quizId" 
          element={
            <ProtectedRoute>
              <QuizAttemptsPage />
            </ProtectedRoute>
          } 
        />

        {/* Rotta per la revisione di un tentativo */}
        <Route 
          path="/review/:attemptId" 
          element={
            <ProtectedRoute>
              <QuizReviewPage />
            </ProtectedRoute>
          } 
        />

        {/* Rotte per la gestione delle amicizie */}
        <Route 
          path="/friendship/requests" 
          element={
            <ProtectedRoute>
              <FriendshipRequestsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/friendship/friends" 
          element={
            <ProtectedRoute>
              <FriendsListPage />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/profile/:userId" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile/" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/liked-quizzes" 
          element={
            <ProtectedRoute>
              <LikedQuizzesPage />
            </ProtectedRoute>
          } 
        />
                <Route 
          path="/attempted-quizzes" 
          element={
            <ProtectedRoute>
              <AttemptedQuizPage />
            </ProtectedRoute>
          } 
        />
        </Routes>
      </main>
    </div>
  );
}