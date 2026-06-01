# Auth Service

Microservizio C# responsabile esclusivamente di registrazione, login e distribuzione della chiave pubblica JWT. Fa parte del monorepo **QuizAI**.

Gli altri servizi validano i token autonomamente usando la chiave pubblica esposta via JWKS — non chiamano auth-service ad ogni richiesta.

---

## Architettura

```
Client
  │
  ├── POST /auth/register ──────────────┐
  ├── POST /auth/login                  │
  │        ↓ JWT (RS256)                │
  │   token firmato con                 ▼
  │   chiave PRIVATA RSA           MySQL (users)
  │
  └── altri servizi
       GET /.well-known/openid-configuration
       GET /auth/.well-known/jwks.json
            ↓ chiave PUBBLICA RSA
       validazione token locale (nessuna chiamata a runtime)
```

### Perché RS256 e non HS256

Con una chiave simmetrica (HS256) ogni servizio che valida il token deve conoscere il segreto — e quindi potrebbe anche **creare** token falsi. Con RS256 solo auth-service ha la chiave privata; gli altri ricevono solo la chiave pubblica e possono verificare ma non forgiare token.

---

## Stack

- **.NET 8** / ASP.NET Core Web API
- **MySQL** — store utenti via Entity Framework Core (Pomelo)
- **ASP.NET Core Identity** — gestione utenti e hashing password
- **JWT RS256** — firma con chiave RSA privata, verifica con chiave pubblica
- **Swashbuckle** — Swagger UI

---

## Struttura

```
src/
├── Program.cs                        # DI, Identity, EF, Swagger
├── Auth/
│   ├── AuthController.cs             # POST /auth/register, /auth/login
│   ├── AuthService.cs
│   ├── IAuthService.cs
│   └── Dtos/                         # RegisterRequest, LoginRequest, AuthResponse
├── Identity/
│   ├── AppUser.cs                    # IdentityUser + CreatedAt
│   └── AppDbContext.cs               # IdentityDbContext<AppUser>
├── Jwt/
│   ├── JwtTokenGenerator.cs          # firma RS256
│   ├── IJwtTokenGenerator.cs
│   └── JwksController.cs             # JWKS + OIDC discovery
└── Keys/
    └── RsaKeyProvider.cs             # genera/carica la coppia RSA
keys/                                 # gitignored — generata a runtime
```

---

## Endpoints

| Metodo | Path | Auth | Descrizione |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Registra nuovo utente, ritorna JWT |
| POST | `/auth/login` | No | Login, ritorna JWT |
| GET | `/auth/.well-known/jwks.json` | No | Chiave pubblica RSA in formato JWK |
| GET | `/.well-known/openid-configuration` | No | Discovery OIDC minimale |
| GET | `/health` | No | `{"status":"ok"}` |

### POST /auth/register
```json
// body
{ "username": "alice", "email": "alice@example.com", "password": "Secret1!" }

// 201 Created
{ "userId": "...", "username": "alice", "email": "alice@example.com",
  "token": "eyJ...", "expiresAt": "2026-05-30T10:00:00Z" }

// 409 Conflict
{ "error": "Email già registrata." }
```

Validazione:
- `username`: 3–20 caratteri, solo `[a-zA-Z0-9_]`
- `email`: formato valido
- `password`: minimo 8 caratteri, almeno un numero

### POST /auth/login
```json
// body
{ "email": "alice@example.com", "password": "Secret1!" }

// 200 OK
{ "userId": "...", "username": "alice", "email": "alice@example.com",
  "token": "eyJ...", "expiresAt": "2026-05-30T10:00:00Z" }

// 401 Unauthorized
{ "error": "Credenziali non valide." }
```

---

## Chiavi RSA

**In sviluppo** — generate automaticamente all'avvio se non esistono:
```
keys/private.pem    ← PKCS#8, gitignored
keys/public.pem     ← SubjectPublicKeyInfo, gitignored
```

**In produzione** — iniettate come variabili d'ambiente in base64:
```bash
RSA_PRIVATE_KEY=$(base64 -w 0 keys/private.pem)
RSA_PUBLIC_KEY=$(base64 -w 0 keys/public.pem)
```

> Le chiavi non devono mai finire nel repository. La cartella `keys/` è in `.gitignore`.

---

## Configurazione

```bash
cp .env.example .env
```

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `MYSQL_URL` | `Server=localhost;...` | **Obbligatoria** |
| `JWT_ISSUER` | `quizai` | |
| `JWT_AUDIENCE` | `quizai` | |
| `JWT_EXPIRY_HOURS` | `24` | |
| `RSA_PRIVATE_KEY` | — | Base64 del private.pem (produzione) |
| `RSA_PUBLIC_KEY` | — | Base64 del public.pem (produzione) |

---

## Avvio

```bash
cd services/auth-service
dotnet restore
dotnet run --project src/
```

Al primo avvio:
1. Genera la coppia RSA in `keys/`
2. Esegue le migration MySQL (`db.Database.MigrateAsync()`)
3. Avvia il server su `http://localhost:5001`

Swagger: `http://localhost:5001/swagger`

---

## Come gli altri servizi validano i token

Nessun segreto condiviso. Ogni servizio punta al discovery endpoint:

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MetadataAddress      = "http://auth-service:5001/.well-known/openid-configuration";
        o.RequireHttpsMetadata = false;
        o.TokenValidationParameters = new()
        {
            ValidIssuer   = "quizai",
            ValidAudience = "quizai",
        };
    });
```

JwtBearer scarica automaticamente la chiave pubblica RSA dal JWKS endpoint, la mette in cache e la aggiorna se cambia. Nessuna chiamata a runtime per ogni richiesta.

---

## Test

```bash
dotnet test
```

| File | Cosa testa |
|------|-----------|
| `tests/Auth/AuthServiceTests.cs` | Register (duplicati), Login (credenziali errate/mancanti) |
| `tests/Auth/JwtTokenGeneratorTests.cs` | Claims nel token, algoritmo RS256, kid |
