# User Service

Microservizio C# responsabile di profili utente, amicizie e sfide tra utenti. Fa parte del monorepo **QuizAI**.

Non gestisce autenticazione (compito di auth-service) né quiz/sessioni (quiz-service). Valida i token JWT autonomamente tramite il JWKS di auth-service.

---

## Architettura

```
Client ──JWT──► User Service (ASP.NET Core 8)
                  │
                  ├── Users        → profilo, profilo pubblico
                  ├── Friendships  → richieste, lista amici
                  └── Challenges   → sfide tra amici su un quiz
                        │
                        ▼
                    MongoDB (quizai_users)
                        │
                  ┌─────┴─────────────┐
                  ▼                   ▼
            RabbitMQ consume     RabbitMQ publish
            user.registered      challenge.created
            quiz.completed
```

### Eventi RabbitMQ
- **Consuma `user.registered`** (da auth-service): crea il profilo utente alla registrazione, così ogni utente è subito risolvibile per username.
- **Consuma `quiz.completed`** (da quiz-service): aggiorna i punteggi di una sfida; quando entrambi hanno giocato, calcola il vincitore.
- **Pubblica `challenge.created`**: quando un utente sfida un amico su un quiz.

---

## Stack

- **.NET 8** / ASP.NET Core Web API
- **MongoDB.Driver** — store profili, amicizie, sfide
- **MassTransit.RabbitMQ** — consumer/publisher (raw JSON, snake_case)
- **JWT Bearer** — validazione via JWKS di auth-service (`MapInboundClaims = false`)

---

## Struttura

```
src/
├── Program.cs                       # DI, JWT (JWKS), MassTransit, indici MongoDB
├── Users/
│   ├── UsersController.cs           # GET/PUT /users/me, GET /users/{username}
│   ├── UserService.cs               # GetOrCreate, update, profilo pubblico
│   ├── UserRepository.cs
│   └── Models/User.cs + Dtos/
├── Friendships/
│   ├── FriendshipsController.cs
│   ├── FriendshipService.cs
│   ├── FriendshipRepository.cs
│   └── Models/Friendship.cs + Dtos/
├── Challenges/
│   ├── ChallengesController.cs
│   ├── ChallengeService.cs
│   ├── ChallengeRepository.cs
│   └── Models/Challenge.cs + Dtos/
└── Messaging/
    ├── Messages/                    # UserRegisteredMessage, QuizCompletedMessage, ChallengeCreatedMessage
    ├── Publishers/ChallengeCreatedPublisher.cs
    └── Consumers/                   # UserRegisteredConsumer, QuizCompletedConsumer
```

---

## Endpoints

Tutti richiedono JWT Bearer tranne `GET /health`.

### Profilo
| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/users/me` | Profilo dell'utente autenticato (creato al primo accesso se assente) |
| PUT | `/users/me` | Aggiorna `bio`, `avatarUrl` (username/email non modificabili) |
| GET | `/users/{username}` | Profilo pubblico (senza email) |

### Amicizie
| Metodo | Path | Note |
|--------|------|------|
| GET | `/users/me/friends` | Lista amici (status accepted) |
| GET | `/users/me/friends/requests` | Richieste in entrata pending |
| POST | `/users/me/friends/requests` | `{username}` → invia richiesta |
| PUT | `/users/me/friends/requests/{id}` | `{action: accept\|reject}` (solo l'addressee) |
| DELETE | `/users/me/friends/{username}` | Rimuove l'amicizia |

### Sfide
| Metodo | Path | Note |
|--------|------|------|
| GET | `/users/me/challenges` | `?status=pending\|accepted\|completed` |
| POST | `/users/me/challenges` | `{username, quizId}` → sfida un amico |
| PUT | `/users/me/challenges/{id}/respond` | `{action: accept\|reject}` (solo il challenged) |

### Health
| Metodo | Path |
|--------|------|
| GET | `/health` |

---

## MongoDB — Collections

- **users**: `{ _id (userId), username, email, avatar_url, bio, created_at, updated_at }`
- **friendships**: `{ requester_id, addressee_id, status, created_at, updated_at }`
- **challenges**: `{ challenger_id, challenged_id, quiz_id, status, challenger_score, challenged_score, winner_id, ... }`

### Indici (creati in `Program.cs` all'avvio)
```
users:       { username: 1 } unique, { email: 1 } unique
friendships: { requester_id: 1, addressee_id: 1 } unique
             { addressee_id: 1, status: 1 }
challenges:  { challenger_id: 1, status: 1 }
             { challenged_id: 1, status: 1 }
             { quiz_id: 1, status: 1 }
```

---

## Configurazione

```bash
cp .env.example .env
```

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `MONGODB_URL` | `mongodb://localhost:27017` | Replica set richiesto per le transazioni quiz-service, qui opzionale |
| `MONGODB_DB` | `quizai_users` | |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672/` | |
| `AUTH_SERVICE_URL` | `http://auth-service:5001` | Per il discovery JWKS |
| `JWT_ISSUER` | `quizai` | |
| `JWT_AUDIENCE` | `quizai` | |

---

## Avvio

### Locale

```bash
cd services/user-service
dotnet restore
dotnet run --project src/
```

Parte su `http://localhost:5002`. Swagger: `http://localhost:5002/swagger`.

### Docker Compose

```bash
cd infrastracture
docker compose -f docker-compose.quiz.yml up --build user-service
```

---

## Test

```bash
dotnet test
```

| File | Cosa testa |
|------|-----------|
| `tests/Friendships/FriendshipServiceTests.cs` | Invio richiesta (duplicati, già amici), accetta/rifiuta, autorizzazione |
| `tests/Challenges/ChallengeServiceTests.cs` | Creazione sfida (non amici, duplicati), risposta, autorizzazione |

---

## Note architetturali

**Profilo lazy + evento** — il profilo viene creato sia su `user.registered` (subito alla registrazione) sia al primo `GET /users/me` (fallback idempotente). Questo garantisce che mittente e destinatario di una richiesta di amicizia siano sempre risolvibili per username.

**`MapInboundClaims = false`** — necessario per leggere i claim `sub`/`email`/`username` con i nomi originali; col mapping di default il claim `email` verrebbe rinominato e letto come vuoto.

**Solo l'addressee/challenged risponde** — accettare/rifiutare richieste e sfide è consentito solo al destinatario, verificato dal claim `sub`.
