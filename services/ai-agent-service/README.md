# AI Agent Service

Microservizio Python responsabile della generazione automatica di quiz tramite LLM. Fa parte del monorepo **QuizAI**.

Riceve una richiesta di generazione da RabbitMQ, esegue una pipeline LangGraph a 4 nodi che pianifica, genera, valida e arricchisce le domande, poi pubblica il risultato sulla coda di risposta.

Supporta inoltre la **generazione da documento (RAG)**: se la richiesta include `source_text` (testo estratto da un PDF/DOCX/PPTX caricato dall'utente), planner e generator vengono ancorati al contenuto del documento tramite un indice BM25 in-memory effimero. Il documento non viene mai salvato né messo in cache: il testo vive solo nel messaggio transitorio e nello stato della pipeline, e viene scartato a fine generazione (non viene persistito su MongoDB).

---

## Architettura

```
RabbitMQ                   LangGraph Pipeline                  RabbitMQ
quiz.generate  →  planner → generator → validator → enricher  →  quiz.generated
                                            ↑___retry (max 3)___↓
```

### Nodi della pipeline

| Nodo | Responsabilità |
|------|---------------|
| **planner** | Analizza topic e difficoltà, decide subtopic e distribuzione domande |
| **generator** | Chiama GROQ con output strutturato via `instructor`, produce domande raw |
| **validator** | Verifica 4 opzioni, `correct_index` valido, no duplicati, conteggio corretto |
| **enricher** | Aggiunge tag tematici e metadati (lingua, data) a ogni domanda |

Il validator fa fino a **3 retry** sul generator prima di pubblicare `status: failed`.

---

## Stack

- **Python 3.11**
- **FastAPI** — `GET /health` e `POST /documents/extract` (estrazione testo interna)
- **pypdf / python-docx / python-pptx** — estrazione testo in memoria da PDF/DOCX/PPTX
- **rank-bm25** — retrieval lessicale effimero per ancorare le domande al documento
- **LangGraph** — orchestrazione della pipeline
- **LangChain + GROQ** — LLM (`llama-3.3-70b-versatile`)
- **instructor** — output strutturato forzato dall'LLM
- **aio-pika** — consumer/publisher RabbitMQ async
- **motor** — persistenza quiz su MongoDB async
- **pydantic-settings** — configurazione da `.env`

---

## Struttura

```
src/
├── main.py                          # FastAPI + consumer RabbitMQ (asyncio.gather)
├── config.py                        # Settings da .env
├── api/routes/health.py             # GET /health
├── agent/
│   ├── graph.py                     # Grafo LangGraph compilato
│   ├── state.py                     # AgentState dataclass
│   ├── nodes/                       # Un file per nodo
│   └── prompts/                     # Prompt separati dai nodi
├── contracts/
│   ├── events.py                    # QuizGenerateEvent, QuizGeneratedEvent
│   └── models.py                    # Question, QuizPlan
├── messaging/
│   ├── consumer.py                  # Ascolta quiz.generate
│   ├── publisher.py                 # Pubblica quiz.generated
│   └── handlers/quiz_generation_handler.py
└── infrastructure/
    ├── groq_client.py               # Retry esponenziale via tenacity
    └── mongo_client.py              # Salvataggio non-fatal
```

**Regola di coupling:** i nodi in `agent/nodes/` non importano nulla da `messaging/`. L'unico punto di contatto è `handlers/quiz_generation_handler.py`.

---

## Configurazione

```bash
cp .env.example .env
```

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `GROQ_API_KEY` | — | **Obbligatoria** |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Modello GROQ |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672/` | |
| `RABBITMQ_QUEUE_CONSUME` | `quiz.generate` | |
| `RABBITMQ_QUEUE_PUBLISH` | `quiz.generated` | |
| `MONGODB_URL` | `mongodb://localhost:27017` | |
| `MONGODB_DB` | `quizai` | |
| `INTERNAL_API_KEY` | — | Autenticazione interna |

---

## Avvio

### Docker Compose (consigliato)

Avvia RabbitMQ, MongoDB e il servizio insieme:

```bash
cd infrastructure
docker compose -f docker-compose.quiz.yml up --build
```

Per hot-reload durante lo sviluppo:

```bash
docker compose -f docker-compose.quiz.yml watch
```

### Locale

```bash
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Richiede RabbitMQ e MongoDB già attivi.

### Health check

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

---

## Messaggi RabbitMQ

**Ingresso** — `quiz.generate`:
```json
{
  "quiz_id": "abc-123",
  "topic": "Python decorators",
  "difficulty": "medium",
  "num_questions": 5,
  "user_id": "u-42",
  "source_text": null
}
```

`source_text` è opzionale: se valorizzato (testo del documento caricato, max 60k caratteri) la generazione è ancorata a quel contenuto (RAG). È transitorio e non viene mai persistito.

**Estrazione testo** — `POST /documents/extract` (interno, header `X-Internal-Api-Key`):

Riceve un upload multipart (`file`: PDF/DOCX/PPTX), estrae il testo **in memoria** e lo restituisce. Nessun byte viene scritto su disco dal servizio. Chiamato server-to-server dal Quiz Service.

```json
{ "filename": "appunti.pdf", "char_count": 1234, "suggested_topic": "appunti", "text": "..." }
```

**Uscita** — `quiz.generated`:
```json
{
  "quiz_id": "abc-123",
  "status": "ready",
  "questions": [
    {
      "text": "...",
      "options": ["...", "...", "...", "..."],
      "correct_index": 2,
      "explanation": "..."
    }
  ],
  "tags": ["python", "programming"],
  "error": null
}
```

`status` è `failed` e `error` è valorizzato se la pipeline non riesce dopo 3 tentativi.

---

## Test

```bash
pip install pytest pytest-mock
pytest tests/unit/       # zero dipendenze esterne
pytest tests/            # include integration (GROQ mockato)
```

| File | Cosa testa |
|------|-----------|
| `tests/unit/test_planner.py` | Nodo planner, gestione errori LLM |
| `tests/unit/test_validator.py` | Validazione domande, logica di retry |
| `tests/unit/test_enricher.py` | Tag derivati, metadati aggiunti |
| `tests/integration/test_pipeline.py` | Pipeline completa: happy path, retry, fail |

---

## Smoke test

Per testare la pipeline direttamente senza RabbitMQ:

```bash
python smoke.py
```

Per testare il flusso RabbitMQ completo (simula il Quiz Service):

```bash
python ../../quiz.py   # richiede l'AI Agent già in ascolto
```
