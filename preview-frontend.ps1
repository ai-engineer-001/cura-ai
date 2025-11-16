#!/usr/bin/env pwsh
# Local Preview Script - Frontend Only

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Cura AI Frontend - Local Preview              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$frontendPath = "frontend-new"

# Check if frontend directory exists
if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Frontend directory not found: $frontendPath" -ForegroundColor Red
    exit 1
}

# Copy local environment
Write-Host "📝 Setting up local environment..." -ForegroundColor Yellow
Copy-Item "$frontendPath\.env.local" "$frontendPath\.env.development.local" -Force

# Install dependencies if needed
if (-not (Test-Path "$frontendPath\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm install --legacy-peer-deps
    Set-Location ..
}

# Start frontend
Write-Host "`n🚀 Starting frontend on http://localhost:3001" -ForegroundColor Green
Write-Host "   Connected to: http://localhost:3000/api" -ForegroundColor Gray
Write-Host "`n⚠️  Make sure backend is running on port 3000!`n" -ForegroundColor Yellow

Set-Location $frontendPath
npm run dev
