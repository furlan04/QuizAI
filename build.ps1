# Build script per QuizAI (Frontend React + Backend .NET)

Write-Host "Avvio build per il progetto..." -ForegroundColor Cyan

# === Backend (.NET) ===
Write-Host "Ripristino pacchetti backend..." -ForegroundColor Yellow
dotnet restore ./QuizAI.ServerWeb

Write-Host "Build backend..." -ForegroundColor Yellow
dotnet build ./QuizAI.ServerWeb -c Release

# === Frontend (React) ===
Write-Host "Installazione dipendenze frontend..." -ForegroundColor Yellow
Set-Location ./QuizAI.ClientWeb
npm install
Set-Location ..

Write-Host "Build completata con successo!" -ForegroundColor Green
Write-Host ""
Write-Host "Per avviare il progetto:" -ForegroundColor Cyan
Write-Host "  Backend: dotnet run --project ./QuizAI.ServerWeb" -ForegroundColor White
Write-Host "  Frontend: cd QuizAI.ClientWeb && npm start" -ForegroundColor White