# Quiz Service

Microservizio C# responsabile della gestione dei quiz, delle sessioni di gioco e delle classifiche. Fa parte del monorepo **QuizAI**.

Espone una REST API con autenticazione JWT, persiste i dati su MongoDB e comunica con l'AI Agent Python tramite RabbitMQ per la generazione asincrona dei quiz.

---

## Architettura

```
Client
  │
  ▼
REST API (ASP.NET Core 8)
  │
  ├── Auth      → JWT register/login
  ├── Quizzes   → CRUD + genera via AI
  ├── Sessions  → gioca un quiz, rispondi, completa
  ├── Leaderboard → top 100 per quiz
  └── Users     → profilo + storico tentativi
        │
        ▼
    MongoDB
        │
  ┌─────┴──────┐
  ▼            ▼
RabbitMQ    RabbitMQ
quiz.generate  quiz.generated
  │            │
  └────────────┘
       AI Agent Service (Python)
```

### Flusso generazione quiz
1. `POST /quizzes/generate` → salva quiz con `status: generating`, pubblica su `quiz.generate`
2. AI Agent genera le domande e pubblica su `quiz.generated`
3. `QuizGeneratedConsumer` aggiorna il quiz con domande, tag e `status: ready`
4. `GET /quizzes/{id}` → 202 se ancora in generazione, 200 con domande se pronto

---

## Stack

- **.NET 8** / ASP.NET Core Web API
- **MongoDB.Driver** — accesso a MongoDB
- **MassTransit.RabbitMQ** — consumer/publisher RabbitMQ senza envelope MassTransit (raw JSON)
- **Microsoft.AspNetCore.Authentication.JwtBearer** — autenticazione JWT
- **BCrypt.Net-Next** — hashing password

---

## Struttura

```
src/
├── Program.cs                        # DI, JWT, MassTransit, indici MongoDB
├── appsettings.json
├── Auth/
│   ├── AuthController.cs             # POST /auth/register, /auth/login
│   ├── AuthService.cs
│   ├── IAuthService.cs
│   └── JwtTokenGenerator.cs
├── Quizzes/
│   ├── QuizzesController.cs          # GET /quizzes, GET /quizzes/{id}, POST /quizzes/generate
│   ├── QuizRepository.cs
│   ├── IQuizRepository.cs
│   └── Models/Quiz.cs, Question.cs
├── Sessions/
│   ├── SessionsController.cs         # POST /sessions, PUT /sessions/{id}/answer, ...
│   ├── SessionService.cs             # logica business + transazione MongoDB
│   ├── ISessionService.cs
│   ├── SessionRepository.cs
│   └── Models/Session.cs
├── Leaderboard/
│   └── LeaderboardController.cs      # GET /quizzes/{id}/leaderboard
├── Users/
│   ├── UsersController.cs            # GET /users/me, GET /users/me/attempts/{quizId}
│   ├── UserRepository.cs
│   └── Models/User.cs
└── Messaging/
    ├── Messages/
    │   ├── QuizGenerateMessage.cs
    │   └── QuizGeneratedMessage.cs
    ├── Publishers/QuizGenerationPublisher.cs
    └── Consumers/QuizGeneratedConsumer.cs
```

---

## Endpoints

### Auth (pubblici)
| Metodo | Path | Body | Risposta |
|--------|------|------|---------|
| POST | `/auth/register` | `{username, email, password}` | `{userId, username, email, token}` |
| POST | `/auth/login` | `{email, password}` | `{userId, username, email, token}` |

### Quizzes
| Metodo | Path | Auth | Note |
|--------|------|------|------|
| GET | `/quizzes` | No | `?topic=&difficulty=&page=&pageSize=` |
| GET | `/quizzes/{id}` | No | 202 se generating, 500 se failed |
| POST | `/quizzes/generate` | ✓ | `{topic, difficulty, num_questions}` → 202 |

### Sessions
| Metodo | Path | Auth | Note |
|--------|------|------|------|
| POST | `/sessions` | ✓ | `{quiz_id}` — domande senza `correct_index` |
| PUT | `/sessions/{id}/answer` | ✓ | `{question_index, selected_index}` |
| POST | `/sessions/{id}/complete` | ✓ | Transazione atomica MongoDB |
| GET | `/sessions/{id}` | ✓ | Sessione completa con risposte |

### Altro
| Metodo | Path | Auth |
|--------|------|------|
| GET | `/quizzes/{id}/leaderboard` | No |
| GET | `/users/me` | ✓ |
| GET | `/users/me/attempts/{quizId}` | ✓ |
| GET | `/health` | No |

---

## Configurazione

```bash
cp .env.example .env
```

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `MONGODB_URL` | `mongodb://localhost:27017` | |
| `MONGODB_DB` | `quizai` | |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672/` | |
| `JWT_SECRET` | — | **Obbligatoria**, min 32 caratteri |
| `JWT_ISSUER` | `quizai` | |
| `JWT_AUDIENCE` | `quizai` | |
| `JWT_EXPIRY_HOURS` | `24` | |

In sviluppo locale i valori possono stare in `appsettings.Development.json`. In produzione (Docker) usa le variabili d'ambiente.

---

## Avvio

### Locale

```bash
cd services/quiz-service
dotnet restore
dotnet run --project src/
```

Il servizio parte su `http://localhost:8080`.

### Docker Compose

Scommentare il blocco `quiz-service` in `infrastructure/docker-compose.quiz.yml`, poi:

```bash
cd infrastructure
docker compose -f docker-compose.quiz.yml up --build
```

### Health check

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```

---

## Test

```bash
cd services/quiz-service
dotnet test
```

| File | Cosa testa |
|------|-----------|
| `tests/Auth/AuthServiceTests.cs` | Register (duplicati, hash), Login (credenziali errate) |
| `tests/Quizzes/QuizzesControllerTests.cs` | Paginazione, status 202/404, generazione |
| `tests/Sessions/SessionServiceTests.cs` | Creazione sessione, risposta corretta/errata, accesso non autorizzato |

---

## Note architetturali

**Transazione atomica** — `POST /sessions/{id}/complete` usa `IMongoClient.StartSessionAsync()` + `StartTransaction()`. Le scritture su `sessions`, `users.attempts` e `quizzes.leaderboard` sono atomiche: se una fallisce, nessuna viene applicata.

**Raw JSON con MassTransit** — il bus è configurato con `UseRawJsonSerializer` + `JsonNamingPolicy.SnakeCaseLower` per essere compatibile con l'AI Agent Python senza il wrapper MassTransit.

**Domande senza risposte** — `POST /sessions` restituisce `QuestionDto(Text, Options)`, senza `correct_index` né `explanation`. Le risposte corrette rimangono solo in MongoDB fino al completamento.
