#!/usr/bin/env bash
set -e  # stop se un comando fallisce

echo "🚀 Avvio build per il progetto..."

# === Backend (.NET) ===
echo "📦 Ripristino pacchetti backend..."
dotnet restore ./QuizAI.ServerWeb

echo "🔨 Build backend..."
dotnet build ./QuizAI.ServerWeb -c Release

# === Frontend (React) ===
echo "📦 Installazione dipendenze frontend..."
cd ./QuizAI.ClientWeb
npm install
cd ..

echo "✅ Build completata con successo!"
