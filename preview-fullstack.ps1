#!/usr/bin/env pwsh
# Full Stack Local Preview Script

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Cura AI Platform - Full Stack Local Preview      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Setup backend
Write-Host "🔧 Setting up backend..." -ForegroundColor Yellow
Copy-Item "curai-backend\.env.local" "curai-backend\.env" -Force

if (-not (Test-Path "curai-backend\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Gray
    Set-Location curai-backend
    npm install
    Set-Location ..
}

# Setup frontend
Write-Host "🔧 Setting up frontend..." -ForegroundColor Yellow
Copy-Item "frontend-new\.env.local" "frontend-new\.env.development.local" -Force

if (-not (Test-Path "frontend-new\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Gray
    Set-Location frontend-new
    npm install --legacy-peer-deps
    Set-Location ..
}

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ Setup Complete!                       ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 Starting services..." -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3001`n" -ForegroundColor White

# Start backend in background
Write-Host "🚀 Starting backend..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\curai-backend
    npm run dev
}

Start-Sleep -Seconds 3

# Start frontend in background
Write-Host "🚀 Starting frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend-new
    npm run dev
}

Start-Sleep -Seconds 5

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           🎉 Full Stack Running Locally!             ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🌐 Open in browser:" -ForegroundColor Cyan
Write-Host "   http://localhost:3001`n" -ForegroundColor White

Write-Host "📊 Monitor logs:" -ForegroundColor Cyan
Write-Host "   Backend:  Receive-Job $($backendJob.Id)" -ForegroundColor Gray
Write-Host "   Frontend: Receive-Job $($frontendJob.Id)`n" -ForegroundColor Gray

Write-Host "🛑 To stop:" -ForegroundColor Red
Write-Host "   Stop-Job $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor Gray
Write-Host "   Remove-Job $($backendJob.Id),$($frontendJob.Id)`n" -ForegroundColor Gray

# Open browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:3001"

# Keep script running and show logs
Write-Host "Press Ctrl+C to stop all services...`n" -ForegroundColor Yellow

try {
    while ($true) {
        $backendOutput = Receive-Job -Job $backendJob 2>&1
        $frontendOutput = Receive-Job -Job $frontendJob 2>&1
        
        if ($backendOutput) {
            Write-Host "[Backend] $backendOutput" -ForegroundColor Blue
        }
        if ($frontendOutput) {
            Write-Host "[Frontend] $frontendOutput" -ForegroundColor Magenta
        }
        
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "`n🛑 Stopping services..." -ForegroundColor Red
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "✅ All services stopped`n" -ForegroundColor Green
}
