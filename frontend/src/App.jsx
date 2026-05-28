// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { isAuthenticated, logout } from "./services";
import {
  RegisterPage,
  LoginPage,
  QuizCreatePage,
  QuizPlayPage,
  HomePage,
  FriendshipRequestsPage,
  FriendsListPage,
  LeaderboardPage,
  QuizAttemptsPage,
  QuizReviewPage,
  SettingsPage,
  FYPage,
  ProfilePage,
  QuizListPage,
  LikedQuizzesPage,
} from "./pages";
import {
  Navbar,
  ProtectedRoute,
  PublicRoute,
} from "./components";
import "./styles/App.css";
import AttemptedQuizPage from "./pages/AttemptedQuizzesPage";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
  };

  return (      
    <Router>
      <div className={`app-container ${isLoggedIn ? 'authenticated' : 'public'}`}>
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
        {/* Rotta home - reindirizza ai quiz se loggato */}
        <Route 
          path="/" 
          element={
            isLoggedIn ? (
              <ProtectedRoute isLoggedIn={isLoggedIn}>
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
            <PublicRoute isLoggedIn={isLoggedIn}>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute isLoggedIn={isLoggedIn}>
              <LoginPage setIsLoggedIn={setIsLoggedIn} />
            </PublicRoute>
          } 
        />
        
        {/* Rotte per i quiz */}
        <Route 
          path="/quizzes" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <QuizListPage />
            </ProtectedRoute>
          } 
        />
        {/* Rotta per i quiz di un utente specifico */}
        <Route 
          path="/quizzes/:userId" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <QuizListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/quizzes/create" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <QuizCreatePage/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/quiz/:id" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <QuizPlayPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotta per la classifica del quiz */}
        <Route 
          path="/leaderboard/:quizId" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <LeaderboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Rotta per i tentativi del quiz */}
        <Route 
          path="/attempts/:quizId" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <QuizAttemptsPage />
            </ProtectedRoute>
          } 
        />

        {/* Rotta per la revisione di un tentativo */}
        <Route 
          path="/review/:attemptId" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <QuizReviewPage />
            </ProtectedRoute>
          } 
        />

        {/* Rotte per la gestione delle amicizie */}
        <Route 
          path="/friendship/requests" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <FriendshipRequestsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/friendship/friends" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <FriendsListPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile/:userId" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile/" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/liked-quizzes" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <LikedQuizzesPage />
            </ProtectedRoute>
          } 
        />
                <Route 
          path="/attempted-quizzes" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <AttemptedQuizPage />
            </ProtectedRoute>
          } 
        />
          </Routes>
        </main>
      </div>
    </Router>  
  );
}