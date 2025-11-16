#!/usr/bin/env pwsh

# Cura AI Backend + RAG Frontend Launcher

Write-Host "🚀 Starting Cura AI Backend with RAG..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure:" -ForegroundColor Yellow
    Write-Host "  - OPENROUTER_API_KEY" -ForegroundColor Yellow
    Write-Host "  - PINECONE_API_KEY" -ForegroundColor Yellow
    Write-Host "  - PINECONE_INDEX_NAME" -ForegroundColor Yellow
    exit 1
}

# Start backend server
Write-Host "📡 Starting Fastify backend on port 3000..." -ForegroundColor Green
$env:PORT = "3000"

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Open frontend in browser
Write-Host "🌐 Opening frontend test page..." -ForegroundColor Green
$frontendPath = Join-Path $PWD "frontend-test.html"

if (Test-Path $frontendPath) {
    Start-Process $frontendPath
    Write-Host ""
    Write-Host "✅ Backend running at http://localhost:3000" -ForegroundColor Green
    Write-Host "✅ Frontend opened in browser" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Test RAG search:" -ForegroundColor Cyan
    Write-Host "   - 'What are the symptoms of diabetes?'" -ForegroundColor White
    Write-Host "   - 'Explain myocardial infarction treatment'" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C in the backend terminal to stop" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Frontend file not found at: $frontendPath" -ForegroundColor Yellow
}
