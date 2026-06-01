# 🚀 Quiz App – Documentazione Rotte React

**Framework:** React Router v6  
**Autenticazione:** JWT Bearer Token

Le rotte sono divise in tre categorie principali: **Pubbliche**, **Protette**, e **Condizionali**.

## 🔒 Tipi di Rotte

### 🌐 Rotte Pubbliche
Accessibili solo quando l'utente **NON** è autenticato.

### 🔐 Rotte Protette  
Richiedono autenticazione tramite JWT token.

### 🔄 Rotte Condizionali
Comportamento diverso in base allo stato di autenticazione.

---

## 📍 Elenco Rotte

### 🏠 Home & Landing

| Rotta | Tipo | Componente | Descrizione |
|-------|------|------------|-------------|
| `/` | Condizionale | `HomePage` / `FYPage` | Homepage pubblica o Feed utente se autenticato |

### 🔑 Autenticazione

| Rotta | Tipo | Componente | Descrizione |
|-------|------|------------|-------------|
| `/register` | Pubblica | `RegisterPage` | Registrazione nuovo utente |
| `/login` | Pubblica | `LoginPage` | Login utente esistente |

### 📝 Gestione Quiz

| Rotta | Tipo | Componente | Parametri | Descrizione |
|-------|------|------------|-----------|-------------|
| `/quizzes` | Protetta | `QuizListPage` | - | Lista di tutti i quiz |
| `/quizzes/:userId` | Protetta | `QuizListPage` | `userId` | Quiz di un utente specifico |
| `/quizzes/create` | Protetta | `QuizCreatePage` | - | Creazione nuovo quiz |
| `/quiz/:id` | Protetta | `QuizPlayPage` | `id` (quiz ID) | Gioca a un quiz specifico |

### 🎯 Quiz Attempts & Results

| Rotta | Tipo | Componente | Parametri | Descrizione |
|-------|------|------------|-----------|-------------|
| `/attempts/:quizId` | Protetta | `QuizAttemptsPage` | `quizId` | Tentativi per un quiz specifico |
| `/review/:attemptId` | Protetta | `QuizReviewPage` | `attemptId` | Revisione di un tentativo completato |
| `/leaderboard/:quizId` | Protetta | `LeaderboardPage` | `quizId` | Classifica di un quiz |

### 👥 Sistema Amicizie

| Rotta | Tipo | Componente | Descrizione |
|-------|------|------------|-------------|
| `/friendship/requests` | Protetta | `FriendshipRequestsPage` | Richieste di amicizia in sospeso |
| `/friendship/friends` | Protetta | `FriendsListPage` | Lista degli amici |

### 👤 Profili & Preferenze

| Rotta | Tipo | Componente | Parametri | Descrizione |
|-------|------|------------|-----------|-------------|
| `/profile/` | Protetta | `ProfilePage` | - | Profilo utente corrente |
| `/profile/:userId` | Protetta | `ProfilePage` | `userId` | Profilo di un utente specifico |
| `/settings` | Protetta | `SettingsPage` | - | Impostazioni utente |

### 💝 Quiz Preferiti & Tentati

| Rotta | Tipo | Componente | Descrizione |
|-------|------|------------|-------------|
| `/liked-quizzes` | Protetta | `LikedQuizzesPage` | Quiz a cui l'utente ha messo like |
| `/attempted-quizzes` | Protetta | `AttemptedQuizPage` | Quiz tentati dall'utente |

---

## 🔧 Componenti di Controllo

### `<ProtectedRoute>`
Verifica l'autenticazione prima di renderizzare il componente.
```jsx
<ProtectedRoute isLoggedIn={isLoggedIn}>
  <ComponenteProtetto />
</ProtectedRoute>
```

### `<PublicRoute>`
Permette l'accesso solo agli utenti non autenticati.
```jsx
<PublicRoute isLoggedIn={isLoggedIn}>
  <ComponentePubblico />
</PublicRoute>
```

---

## 🗺️ Navigazione Tipica

### Flusso Utente Non Autenticato
```
/ (HomePage) → /login → / (FYPage)
                ↳ /register → /login → / (FYPage)
```

### Flusso Utente Autenticato
```
/ (FYPage) → /quizzes → /quiz/:id → /attempts/:quizId
     ↓            ↓         ↓           ↓
/profile/    /quizzes/create  /review/:attemptId  /leaderboard/:quizId
     ↓
/settings
/friendship/friends
/liked-quizzes
/attempted-quizzes
```

---

## 🎛️ Gestione Stato

### Autenticazione
- **Stato globale**: `isLoggedIn` (boolean)
- **Funzioni**: `isAuthenticated()`, `logout()`
- **Storage**: JWT token in localStorage/sessionStorage

### Logout
```jsx
const handleLogout = () => {
  logout();
  setIsLoggedIn(false);
};
```

### Redirect Logic
- **Non autenticato** su rotta protetta → Redirect a `/login`
- **Autenticato** su rotta pubblica → Redirect a `/` (FYPage)
- **Root path** → Condizionale su stato autenticazione

---

## 📱 Responsive Design

Le rotte utilizzano classi CSS condizionali:
```css
.app-container.authenticated { /* Stili per utenti loggati */ }
.app-container.public { /* Stili per visitatori */ }
```

---

## 🔍 Pattern Utilizzati

1. **Route Protection**: Controllo autenticazione a livello di rotta
2. **Conditional Rendering**: Diverso comportamento in base all'auth
3. **Nested Parameters**: Parametri dinamici nelle URL
4. **Centralized Auth**: Stato autenticazione condiviso
5. **Clean URLs**: Struttura URL intuitiva e RESTful