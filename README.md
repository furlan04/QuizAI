# QuizAI

App sociale per generare quiz tramite AI, giocarli e confrontarsi in classifiche e sfide. Architettura a **microservizi**: ogni dominio è un servizio indipendente che comunica via REST e RabbitMQ.

## Funzionalità

- **Generazione quiz con AI** — scrivi un argomento, un agente LLM genera domande, risposte e spiegazioni
- **Gioco a sessione** — rispondi domanda per domanda con feedback immediato
- **Classifiche** — leaderboard per ogni quiz
- **Social** — amicizie e sfide tra utenti su un quiz specifico

---

## Architettura

```
                         ┌──────────────┐
              ┌────HTTP──►│ auth-service │  JWT RS256, MySQL
              │          └──────┬───────┘
              │                 │ JWKS (chiave pubblica)
   ┌──────────┴─┐        ┌──────▼───────┐
   │  frontend  │──HTTP──►│ quiz-service │  quiz, sessioni, leaderboard (MongoDB)
   │   (React)  │        └──────┬───────┘
   └──────────┬─┘               │ RabbitMQ
              │          ┌───────▼────────┐
              │──HTTP───►│  user-service  │  profili, amicizie, sfide (MongoDB)
              │          └───────┬────────┘
              │                  │ RabbitMQ
              │          ┌───────▼─────────┐
              └─ (no) ───│ ai-agent-service│  pipeline LLM (Python, LangGraph)
                         └─────────────────┘
```

### Servizi

| Servizio | Stack | Porta | Responsabilità |
|----------|-------|-------|----------------|
| [auth-service](services/auth-service) | C# / .NET 8, MySQL, Identity | 5001 | Registrazione, login, JWT RS256, JWKS |
| [quiz-service](services/quiz-service) | C# / .NET 8, MongoDB, MassTransit | 8080 | Quiz, sessioni di gioco, leaderboard |
| [user-service](services/user-service) | C# / .NET 8, MongoDB, MassTransit | 5002 | Profili, amicizie, sfide |
| [ai-agent-service](services/ai-agent-service) | Python 3.11, FastAPI, LangGraph, GROQ | 8000 | Generazione quiz via LLM |
| [frontend](frontend) | React | 3000 | Interfaccia utente |

### Comunicazione asincrona (RabbitMQ)

| Evento | Da → A | Scopo |
|--------|--------|-------|
| `quiz.generate` | quiz-service → ai-agent | Richiesta generazione quiz |
| `quiz.generated` | ai-agent → quiz-service | Quiz pronto (o fallito) |
| `user.registered` | auth-service → user-service | Crea il profilo alla registrazione |
| `quiz.completed` | quiz-service → user-service | Aggiorna i punteggi delle sfide |
| `challenge.created` | user-service → (consumer futuri) | Sfida creata |

### Autenticazione

auth-service firma i JWT con una **chiave RSA privata** (RS256). Gli altri servizi verificano i token con la **chiave pubblica**, recuperata automaticamente dal JWKS di auth-service (`/.well-known/jwks.json`) — nessun segreto condiviso, nessuna chiamata ad auth-service per ogni richiesta.

---

## Avvio rapido (Docker Compose)

Tutto insieme — servizi, frontend e infrastruttura (MongoDB, MySQL, RabbitMQ):

```bash
cd infrastracture
docker compose -f docker-compose.quiz.yml up --build
```

Poi apri **http://localhost:3000**.

> Prima volta: copia i file `.env.example` → `.env` nei servizi che ne hanno bisogno (almeno `ai-agent-service/.env` con la tua `GROQ_API_KEY`).

### Solo infrastruttura (per sviluppo locale dei servizi)

```bash
cd infrastracture
docker compose -f docker-compose.infra.yml up -d   # MongoDB, MySQL, RabbitMQ
```

Poi avvia ogni servizio singolarmente (`dotnet run --project src/`, `uvicorn src.main:app`, `npm start`). Vedi il README di ciascun servizio.

---

## Requisiti per lo sviluppo locale

- Docker + Docker Compose
- .NET 8 SDK (per i servizi C#)
- Python 3.11 (per ai-agent-service)
- Node.js ≥ 18 (per il frontend)
- Una chiave API **GROQ**

---

## Endpoint di salute

```bash
curl http://localhost:5001/health   # auth-service
curl http://localhost:8080/health   # quiz-service
curl http://localhost:5002/health   # user-service
curl http://localhost:8000/health   # ai-agent-service
```

Swagger disponibile su `/swagger` per i tre servizi C#.

---

## Struttura del monorepo

```
QuizAI/
├── services/
│   ├── auth-service/        # C# — autenticazione
│   ├── quiz-service/        # C# — quiz, sessioni, leaderboard
│   ├── user-service/        # C# — profili, amicizie, sfide
│   └── ai-agent-service/    # Python — generazione quiz LLM
├── frontend/                # React
├── shared/
│   └── contracts/events/    # JSON Schema dei messaggi RabbitMQ
└── infrastracture/
    ├── docker-compose.quiz.yml    # stack completo
    └── docker-compose.infra.yml   # solo MongoDB + MySQL + RabbitMQ
```

---

## Test

```bash
# servizi C#
cd services/auth-service && dotnet test
cd services/quiz-service && dotnet test
cd services/user-service && dotnet test

# ai-agent (Python)
cd services/ai-agent-service && pytest
```

---

## Licenza

MIT.
