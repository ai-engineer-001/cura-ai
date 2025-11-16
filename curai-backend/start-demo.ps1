#!/usr/bin/env pwsh
# Cura AI - Start Backend + Frontend Demo

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          Cura AI Medical Assistant Demo              ║" -ForegroundColor Cyan
Write-Host "║     RAG System with Voice + Hybrid Fallback          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🚀 Starting Backend Server..." -ForegroundColor Yellow
Write-Host "   Port: 3000" -ForegroundColor Gray
Write-Host "   API: http://localhost:3000/api/health`n" -ForegroundColor Gray

# Start backend in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location "d:\curaai-platform\curai-backend"
    npm run dev
}

Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is ready!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend might still be starting..." -ForegroundColor Yellow
}

Write-Host "`n🌐 Opening Frontend Test Page..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Open frontend
Start-Process "d:\curaai-platform\curai-backend\frontend-test.html"

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ SYSTEM READY                           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 How to Use:" -ForegroundColor Cyan
Write-Host "   • Text Mode: Type your medical question and click 'Search'" -ForegroundColor White
Write-Host "   • Voice Mode: Click 🎤 'Voice' button and speak your question" -ForegroundColor White
Write-Host "   • The system will respond with text + voice (if voice mode used)`n" -ForegroundColor White

Write-Host "🧪 Try These Examples:" -ForegroundColor Cyan
Write-Host "   1. What are the symptoms of type 2 diabetes?" -ForegroundColor Gray
Write-Host "   2. Explain hypertension treatment options" -ForegroundColor Gray
Write-Host "   3. A child with fever and rash, what could it be?`n" -ForegroundColor Gray

Write-Host "📊 Current Status:" -ForegroundColor Cyan
Write-Host "   • Backend: Running on port 3000" -ForegroundColor Green
Write-Host "   • Frontend: Opened in browser" -ForegroundColor Green
Write-Host "   • Embedding: Check terminal for progress`n" -ForegroundColor Yellow

Write-Host "🛑 To Stop:" -ForegroundColor Red
Write-Host "   Press Ctrl+C in this window, then run:" -ForegroundColor White
Write-Host "   Get-Process -Name node | Stop-Process -Force`n" -ForegroundColor Gray

Write-Host "Press Ctrl+C to stop the demo...`n" -ForegroundColor Yellow

# Keep script running and show backend logs
Write-Host "Backend Logs:" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Magenta

# Stream backend job output
try {
    while ($true) {
        $output = Receive-Job -Job $backendJob 2>&1
        if ($output) {
            $output | ForEach-Object { Write-Host $_ }
        }
        Start-Sleep -Milliseconds 500
        
        # Check if backend job is still running
        if ($backendJob.State -ne 'Running') {
            Write-Host "`n❌ Backend stopped unexpectedly!" -ForegroundColor Red
            break
        }
    }
} catch {
    Write-Host "`nStopping..." -ForegroundColor Yellow
} finally {
    # Cleanup
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Write-Host "`n✅ Demo stopped" -ForegroundColor Green
}
