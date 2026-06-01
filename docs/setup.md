# 🛠️ Setup del Progetto

Questa guida spiega come configurare l'ambiente di sviluppo per **Frontend (React)** e **Backend (.NET)**.

---

## 📋 Prerequisiti

Assicurati di avere installato:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (consigliata l'ultima LTS)
- [npm](https://www.npmjs.com/) (incluso con Node.js)  
  *(oppure Yarn se preferisci)*
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet) (o la versione richiesta dal progetto)
- Un editor di testo/IDE (es. [VS Code](https://code.visualstudio.com/) o Visual Studio)

---

## 🔑 Configurazione delle variabili d'ambiente

Prima di eseguire il progetto, configura le variabili d'ambiente richieste.

### 1. Backend (.NET)

Crea (o modifica) il file:
```
QuizAI.API/Properties/launchSettings.json
```
utilizza il file già presente nella cartella come template base

per quanto riguarda le varibili d'ambiente compila il file appsettings.json che di default contiene dei placeholder
si consiglia di creare un file appsettings.Development.json e di usare appsettings.json come template

### 2. Frontend (React)

Nel frontend crea un file `.env` nella cartella `QuizAI.ClientWeb/`:

```ini
REACT_APP_ENDPOINTL=https://localhost:7181/api
```

---

## 🚀 Build del progetto

Nella root del repository esegui:

**Su Linux/macOS:**
```bash
./build.sh
```

**Su Windows:**
```powershell
.\build.ps1
```

Questo comando:
- Esegue `dotnet restore` e build del backend
- Installa le dipendenze del frontend (`npm install`)

---

## ▶️ Avvio del progetto

Dopo la build puoi avviare i due componenti in sviluppo:

**Backend (.NET):**
```bash
cd QuizAI.ServerWeb
dotnet run --project ./QuizAI.API
```

**Frontend (React):**
```bash
cd QuizAI.ClientWeb
npm start
```

- L'app React sarà disponibile di solito su `http://localhost:3000`
- Il backend sarà disponibile su `http://localhost:7181` (o la porta configurata in `launchSettings.json`)

## ✅ Checklist veloce

- [ ] Installa i prerequisiti
- [ ] Configura le variabili d'ambiente (`launchSettings.json` e `.env`)
- [ ] Esegui `./build.sh` o `.\build.ps1`
- [ ] Avvia backend e frontend