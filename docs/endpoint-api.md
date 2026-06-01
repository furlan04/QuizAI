# 📘 Quiz API – Documentazione Endpoints

**Versione:** v1  
**Base URL (sviluppo):** `https://localhost:7181`

Tutte le API (eccetto `Auth/register`, `Auth/login`, `Auth/confirm-email`, `Auth/resend-confirmation-email`) richiedono autenticazione tramite **JWT Bearer Token**:

```http
Authorization: Bearer <token>
```

## 🔑 Auth

### POST /api/Auth/register
Registra un nuovo utente.

**Body (JSON):**
```json
{
  "email": "string",
  "password": "string"
}
```

### POST /api/Auth/login
Effettua il login e restituisce un token JWT.

**Body (JSON):**
```json
{
  "email": "string",
  "password": "string"
}
```

### GET /api/Auth/confirm-email
Conferma email con link ricevuto.

**Query params:**
- `userId`: string
- `token`: string

### POST /api/Auth/resend-confirmation-email
Reinvia email di conferma.

**Body (JSON):**
```json
{
  "email": "string"
}
```

## 👥 Friendship

### GET /api/Friendship/requests
Ottiene la lista delle richieste di amicizia.

**Response:** `FriendRequestDto[]`

### POST /api/Friendship/send-request/{email}
Invia una richiesta di amicizia.

**Parameters:**
- `email`: string (path)

**Response:** `Friendship`

### PUT /api/Friendship/accept-request/{friendshipId}
Accetta una richiesta di amicizia.

**Parameters:**
- `friendshipId`: uuid (path)

**Response:** `Friendship`

### GET /api/Friendship/friend-list
Lista amici correnti.

**Response:** `FriendDto[]`

### DELETE /api/Friendship/remove-friendship/{friendshipId}
Rimuove un'amicizia.

**Parameters:**
- `friendshipId`: uuid (path)

## 👍 Like

### GET /api/Like/{id}
Verifica se un quiz è piaciuto all'utente.

**Parameters:**
- `id`: uuid (quizId)

**Response:** `LikedDto`

### POST /api/Like/{id}
Mette like a un quiz.

**Parameters:**
- `id`: uuid (quizId)

**Response:** `LikeQuiz`

### DELETE /api/Like/{id}
Rimuove like da un quiz.

**Parameters:**
- `id`: uuid (quizId)

## 📝 Quiz

### GET /api/Quiz
Lista dei quiz (opzionale filtro per userId).

**Query params:**
- `userId`: string (opzionale)

**Response:** `Quiz[]`

### GET /api/Quiz/{id}
Recupera un quiz.

**Parameters:**
- `id`: uuid (path)

**Response:** `Quiz`

### DELETE /api/Quiz/{id}
Elimina un quiz.

**Parameters:**
- `id`: uuid (path)

### POST /api/Quiz/{topic}
Crea un nuovo quiz su un topic.

**Parameters:**
- `topic`: string (path)

**Response:** `Quiz`

## 🏆 QuizAttempt

### POST /api/QuizAttempt/submit
Sottomette risposte a un quiz.

**Body (JSON):**
```json
{
  "quizId": "uuid",
  "answers": [
    {
      "questionQuizId": "uuid",
      "questionOrder": 0,
      "selectedAnswerIndex": 0
    }
  ]
}
```

**Response:** `QuizAttemptResultDto`

### GET /api/QuizAttempt/{attemptId}/review
Recupera la review di un tentativo.

**Parameters:**
- `attemptId`: uuid (path)

**Response:** `QuizAttemptReviewDto`

### GET /api/QuizAttempt/leaderboard/{quizId}
Classifica di un quiz.

**Parameters:**
- `quizId`: uuid (path)
- `limit`: int (query, default 50)

**Response:** `QuizLeaderboardDto`

### GET /api/QuizAttempt/my-attempts/{quizId}
Recupera i tentativi fatti dall'utente.

**Parameters:**
- `quizId`: uuid (path)

**Response:** `QuizAttemptResultDto[]`

## 👤 User

### GET /api/User/GetProfile
Recupera profilo utente.

**Query params:**
- `userId`: string

**Response:** `UserProfileDTO`

### GET /api/User/LoadFeed
Carica il feed con i quiz.

**Response:** `Quiz[]`

### GET /api/User/GetSettings
Ottiene le impostazioni utente.

**Response:** `SettingsDto`

### GET /api/User/GetLikedQuizzes
Quiz a cui l'utente ha messo like.

**Response:** `Quiz[]`

### GET /api/User/GetAttemptedQuizzes
Quiz tentati dall'utente.

**Response:** `Quiz[]`

## 📂 Schemi principali (DTO)

### RegisterDto
```json
{
  "email": "string",
  "password": "string"
}
```

### LoginDto
```json
{
  "email": "string",
  "password": "string"
}
```

### FriendDto
```json
{
  "friendshipId": "uuid",
  "friendEmail": "string",
  "friendId": "string"
}
```

### Friendship
```json
{
  "id": "uuid",
  "senderId": "string",
  "receiverId": "string",
  "accepted": "boolean"
}
```

### Quiz
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "createdAt": "datetime",
  "userId": "string"
}
```

### QuizAttemptResultDto
```json
{
  "id": "uuid",
  "quizId": "uuid",
  "completedAt": "datetime",
  "score": "int",
  "percentage": "double",
  "totalQuestions": "int"
}
```

### QuizLeaderboardDto
```json
{
  "quizId": "uuid",
  "entries": "LeaderboardEntryDto[]"
}
```

### UserProfileDTO
```json
{
  "userId": "string",
  "email": "string",
  "friendsCount": "int",
  "isCurrentUser": "bool",
  "isFriend": "bool",
  "friendshipId": "uuid?",
  "haveSentRequest": "bool"
}
```