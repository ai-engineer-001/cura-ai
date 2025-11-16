# Test All Backend Endpoints

Write-Host "🧪 Testing Cura AI Backend..." -ForegroundColor Cyan

# Test 1: Health check
Write-Host "`n1️⃣ Testing /health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:4000/health"
    Write-Host "✅ Health check passed: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    exit 1
}

# Test 2: Demo login
Write-Host "`n2️⃣ Testing /v1/demo/login..." -ForegroundColor Yellow
try {
    $login = Invoke-RestMethod -Uri "http://localhost:4000/v1/demo/login"
    $token = $login.token
    Write-Host "✅ Got demo token: $token" -ForegroundColor Green
} catch {
    Write-Host "❌ Demo login failed" -ForegroundColor Red
    exit 1
}

# Test 3: Get user profile
Write-Host "`n3️⃣ Testing /v1/users/me..." -ForegroundColor Yellow
try {
    $user = Invoke-RestMethod -Uri "http://localhost:4000/v1/users/me" `
        -Headers @{ Authorization="Bearer $token" }
    Write-Host "✅ User profile: $($user.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ User profile failed" -ForegroundColor Red
    exit 1
}

# Test 4: Create chat
Write-Host "`n4️⃣ Testing /v1/chats (POST)..." -ForegroundColor Yellow
try {
    $chat = Invoke-RestMethod -Uri "http://localhost:4000/v1/chats" `
        -Method POST `
        -Headers @{ 
            Authorization="Bearer $token"
            "Content-Type"="application/json"
        } `
        -Body '{"title":"Test Emergency Chat"}'
    $chatId = $chat.chatId
    Write-Host "✅ Created chat: $chatId" -ForegroundColor Green
} catch {
    Write-Host "❌ Create chat failed" -ForegroundColor Red
    exit 1
}

# Test 5: Send message
Write-Host "`n5️⃣ Testing /v1/chats/:chatId/messages (POST)..." -ForegroundColor Yellow
try {
    $message = Invoke-RestMethod -Uri "http://localhost:4000/v1/chats/$chatId/messages" `
        -Method POST `
        -Headers @{ 
            Authorization="Bearer $token"
            "Content-Type"="application/json"
        } `
        -Body '{"text":"Patient has severe chest pain and shortness of breath"}'
    Write-Host "✅ Sent message, got response: $($message.text.Substring(0, [Math]::Min(50, $message.text.Length)))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Send message failed" -ForegroundColor Red
    exit 1
}

# Test 6: List chats
Write-Host "`n6️⃣ Testing /v1/chats (GET)..." -ForegroundColor Yellow
try {
    $chats = Invoke-RestMethod -Uri "http://localhost:4000/v1/chats" `
        -Headers @{ Authorization="Bearer $token" }
    Write-Host "✅ Found $($chats.chats.Count) chat(s)" -ForegroundColor Green
} catch {
    Write-Host "❌ List chats failed" -ForegroundColor Red
    exit 1
}

# Test 7: Presign upload
Write-Host "`n7️⃣ Testing /v1/uploads/presign..." -ForegroundColor Yellow
try {
    $upload = Invoke-RestMethod -Uri "http://localhost:4000/v1/uploads/presign" `
        -Method POST `
        -Headers @{ 
            Authorization="Bearer $token"
            "Content-Type"="application/json"
        } `
        -Body '{"contentType":"audio/webm"}'
    Write-Host "✅ Got presigned URL: $($upload.key)" -ForegroundColor Green
} catch {
    Write-Host "❌ Presign upload failed" -ForegroundColor Red
    exit 1
}

# Test 8: Emergency handoff
Write-Host "`n8️⃣ Testing /v1/chats/:chatId/handoff..." -ForegroundColor Yellow
try {
    $handoff = Invoke-RestMethod -Uri "http://localhost:4000/v1/chats/$chatId/handoff" `
        -Method POST `
        -Headers @{ 
            Authorization="Bearer $token"
            "Content-Type"="application/json"
        } `
        -Body '{"type":"CALL_SUGGEST","phone":"+911234567890"}'
    Write-Host "✅ Handoff recorded: $($handoff.note)" -ForegroundColor Green
} catch {
    Write-Host "❌ Handoff failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ All tests passed! Backend is fully functional." -ForegroundColor Green
Write-Host "`n📱 Next: Open frontend-test/index.html to test the UI" -ForegroundColor Cyan
Write-Host "🎤 Try the Real-Time button for voice streaming!" -ForegroundColor Cyan
