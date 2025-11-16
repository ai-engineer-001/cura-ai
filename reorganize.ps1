#!/usr/bin/env pwsh
# Cura AI Platform Reorganization
# Consolidates multiple backends/frontends into single clean structure

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Cura AI Platform - Directory Consolidation       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Stop all node processes
Write-Host "🛑 Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Create archive structure
Write-Host "📦 Creating archive directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "_archive\old-implementations" | Out-Null

# Move old backends to archive
Write-Host "📥 Archiving old backend implementations..." -ForegroundColor Yellow
$oldBackends = @("backend", "backend-local", "backend-realtime")
foreach ($dir in $oldBackends) {
    if (Test-Path $dir) {
        Write-Host "   Moving $dir..." -ForegroundColor Gray
        Move-Item -Force $dir "_archive\old-implementations\$dir-archived" -ErrorAction SilentlyContinue
    }
}

# Move old frontend to archive
Write-Host "📥 Archiving old frontend..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Write-Host "   Moving frontend..." -ForegroundColor Gray
    Move-Item -Force "frontend" "_archive\old-implementations\frontend-archived" -ErrorAction SilentlyContinue
}

# Wait for file system
Start-Sleep -Seconds 2

# Rename active directories
Write-Host "`n✨ Renaming active implementations..." -ForegroundColor Yellow

if (Test-Path "curai-backend") {
    Write-Host "   curai-backend → backend" -ForegroundColor Green
    Rename-Item -Force "curai-backend" "backend"
} else {
    Write-Host "   ⚠️  curai-backend not found" -ForegroundColor Red
}

if (Test-Path "frontend-new") {
    Write-Host "   frontend-new → frontend" -ForegroundColor Green
    Rename-Item -Force "frontend-new" "frontend"
} else {
    Write-Host "   ⚠️  frontend-new not found" -ForegroundColor Red
}

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ REORGANIZATION COMPLETE                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📁 New Structure:" -ForegroundColor Cyan
Write-Host "   backend/         - Node.js + Fastify + Pinecone + OpenRouter" -ForegroundColor White
Write-Host "   frontend/        - Next.js 14 with voice/video/chat" -ForegroundColor White
Write-Host "   _archive/        - Old implementations preserved`n" -ForegroundColor Gray

Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. cd backend && npm install" -ForegroundColor White
Write-Host "   2. cd frontend && npm install --legacy-peer-deps" -ForegroundColor White
Write-Host "   3. Update .env files with correct paths" -ForegroundColor White
Write-Host "   4. Start: backend (port 3000), frontend (port 3001)`n" -ForegroundColor White
