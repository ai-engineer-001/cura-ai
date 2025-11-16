#!/usr/bin/env pwsh
# Local Preview Script - Backend Only

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Cura AI Backend - Local Preview               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$backendPath = "curai-backend"

# Check if backend directory exists
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

# Copy local environment
Write-Host "📝 Setting up local environment..." -ForegroundColor Yellow
Copy-Item "$backendPath\.env.local" "$backendPath\.env" -Force

# Install dependencies if needed
if (-not (Test-Path "$backendPath\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location $backendPath
    npm install
    Set-Location ..
}

# Start backend
Write-Host "`n🚀 Starting backend on http://localhost:3000" -ForegroundColor Green
Write-Host "   Health: http://localhost:3000/api/health" -ForegroundColor Gray
Write-Host "   API: http://localhost:3000/api/search`n" -ForegroundColor Gray

Set-Location $backendPath
npm run dev
