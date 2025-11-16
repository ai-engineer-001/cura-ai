# Cura AI Local Backend + Test Frontend

Real OpenRouter-powered emergency chat backend with real-time WebSocket streaming + beautiful test UI.

## ✨ What You Get

**Backend (`backend-local/`):**
- ✅ REST API: `/v1/demo/login`, `/v1/chats`, `/v1/messages`, etc.
- ✅ **Real OpenRouter streaming** with `meta-llama/llama-3.3-8b-instruct:free`
- ✅ WebSocket realtime endpoint for voice/text streaming
- ✅ Mock ASR (transcription placeholder - add Whisper later)
- ✅ In-memory user/chat storage (no database needed for testing)

**Frontend (`frontend-test/index.html`):**
- ✅ Bottom-centered chat input (Gemini-live style)
- ✅ Real-Time streaming overlay with waveform animation
- ✅ MediaRecorder audio capture (2-second chunks)
- ✅ WebSocket integration with token-by-token LLM streaming
- ✅ Emergency controls (Call 911, Share Location)
- ✅ Medical-themed purple gradient design
- ✅ Fully responsive mobile/desktop

## 🚀 Quick Start (3 Steps)

### 1. Install & Configure

```pwsh
cd backend-local
npm install
Copy-Item .env.example .env
```

**Edit `.env`** and add your OpenRouter API key:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
MODE=real
```

### 2. Start Backend

```pwsh
node src/server.js
```

You'll see:
```
✅ Server listening on http://localhost:4000
🔐 Demo login: GET http://localhost:4000/v1/demo/login
🔑 OpenRouter: Configured
🤖 Model: meta-llama/llama-3.3-8b-instruct:free
⚙️  Mode: real
```

### 3. Open Frontend

```pwsh
cd frontend-test
# Option 1: Direct open (Chrome/Firefox)
start index.html

# Option 2: Local server (recommended for WebSocket)
npx serve .
# Then open http://localhost:3000
```

## 🧪 Testing

### Test Text Chat
1. Type message in bottom input: "Patient has chest pain"
2. Press Enter or click Send
3. Watch LLM stream response token-by-token

### Test Real-Time Voice Mode
1. Click **Real-Time** button (bottom right)
2. Allow microphone access
3. Speak normally - audio sent every 2 seconds
4. See mock transcription appear
5. LLM responds with streaming emergency guidance

### Test REST API

**Get demo token:**
```pwsh
Invoke-RestMethod -Uri http://localhost:4000/v1/demo/login
# Save the returned token
```

**Create chat:**
```pwsh
$token = "token_xxx"  # from above
Invoke-RestMethod -Uri http://localhost:4000/v1/chats `
  -Method POST `
  -Headers @{ Authorization="Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"title":"Emergency Test"}'
```

**Send message:**
```pwsh
$chatId = "xxx"  # from above
Invoke-RestMethod -Uri "http://localhost:4000/v1/chats/$chatId/messages" `
  -Method POST `
  -Headers @{ Authorization="Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"text":"Patient collapsed"}'
```

### Test WebSocket (Browser Console)

```javascript
// Get token first
const loginResp = await fetch('http://localhost:4000/v1/demo/login');
const { token } = await loginResp.json();

// Create chat
const chatResp = await fetch('http://localhost:4000/v1/chats', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ title: 'WS Test' })
});
const { chatId } = await chatResp.json();

// Connect WebSocket
const ws = new WebSocket(`ws://localhost:4000/realtime?chatId=${chatId}&token=${token}`);

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'control', action: 'start_realtime' }));
};

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  console.log(data.type, data);
};

// Send text message
ws.send(JSON.stringify({ 
  type: 'text_message', 
  text: 'Patient has chest pain and trouble breathing' 
}));
```

## 📡 WebSocket Protocol

### Client → Server

**Start streaming:**
```json
{ "type": "control", "action": "start_realtime" }
```

**Audio chunk (webm-opus base64):**
```json
{
  "type": "audio_chunk",
  "seq": 1,
  "audio_format": "webm-opus",
  "payload": "<base64_audio_data>"
}
```

**Text message:**
```json
{
  "type": "text_message",
  "text": "Patient needs help"
}
```

### Server → Client

**Transcription:**
```json
{
  "type": "transcription",
  "interim": false,
  "text": "Patient needs emergency assistance"
}
```

**Streaming token:**
```json
{
  "type": "assistant_token",
  "token": "Stay calm."
}
```

**Final response:**
```json
{
  "type": "assistant_final",
  "text": "Stay calm. Call 911 immediately..."
}
```

## 🎯 How It Works

### Real OpenRouter Integration

```javascript
// In src/server.js - streamOpenRouterCompletion()
const response = await axios.post(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    model: "meta-llama/llama-3.3-8b-instruct:free",
    messages: conversationHistory,
    stream: true
  },
  {
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    responseType: "stream"
  }
);

// Parse SSE stream
response.data.on("data", (chunk) => {
  // Extract tokens from "data: {...}" lines
  // Send each token via WebSocket
  socket.send(JSON.stringify({ 
    type: "assistant_token", 
    token: delta.content 
  }));
});
```

### Audio Capture (Frontend)

```javascript
// MediaRecorder captures audio in 2-second chunks
mediaRecorder = new MediaRecorder(audioStream, {
  mimeType: 'audio/webm;codecs=opus'
});

mediaRecorder.ondataavailable = (event) => {
  // Convert to base64
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result.split(',')[1];
    ws.send(JSON.stringify({
      type: 'audio_chunk',
      audio_format: 'webm-opus',
      payload: base64
    }));
  };
  reader.readAsDataURL(event.data);
};

mediaRecorder.start(2000); // 2-second chunks
```

## 🔧 Customization

### Add Real Whisper ASR

Replace mock transcription in `src/server.js`:

```javascript
// Current (line ~270)
const transcription = "Patient needs emergency assistance";

// Replace with:
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Decode base64 → write temp file → transcribe
const audioBuffer = Buffer.from(data.payload, 'base64');
fs.writeFileSync('/tmp/audio.webm', audioBuffer);
const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream('/tmp/audio.webm'),
  model: 'whisper-1'
});
```

### Change LLM Model

Edit `.env`:
```env
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

Or any [OpenRouter model](https://openrouter.ai/models).

### Add Database Persistence

Replace in-memory `Map` with Postgres/MongoDB:

```javascript
// Current
const chats = new Map();

// Replace with:
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET /v1/chats
const chats = await prisma.chat.findMany({ 
  where: { userId: u.id } 
});
```

## 📁 File Structure

```
backend-local/
├── src/
│   └── server.js          # Main Fastify server (300 lines)
├── frontend-test/
│   ├── index.html         # Test UI (500 lines)
│   └── README.md          # Frontend docs
├── package.json
├── .env.example
└── README.md              # This file
```

## 🐛 Troubleshooting

### Backend won't start
```pwsh
# Check if port 4000 is in use
Get-NetTCPConnection -LocalPort 4000

# Kill process if needed
Stop-Process -Id <PID>

# Restart
cd backend-local
node src/server.js
```

### OpenRouter not working
- Check `.env` has valid key: `OPENROUTER_API_KEY=sk-or-v1-...`
- Verify mode: `MODE=real` (not `mock`)
- Check logs for API errors
- Test directly: `curl https://openrouter.ai/api/v1/auth/key -H "Authorization: Bearer $key"`

### WebSocket connection fails
- Ensure backend is running
- Check CORS: frontend must be on `http://localhost` or `http://127.0.0.1`
- Verify token from `/v1/demo/login`

### Audio not capturing
- Grant microphone permission in browser
- Check browser console for MediaRecorder errors
- Verify codec support: `MediaRecorder.isTypeSupported('audio/webm;codecs=opus')`

## 🎨 Frontend UI Spec

**Bottom-Centered Chat Input:**
- Width: 86% desktop, 96% mobile, max 880px
- Textarea auto-grows to 6 lines
- Send button (blue) + Real-Time button (outlined → filled when active)

**Real-Time Overlay:**
- Backdrop blur + 95% white background
- Animated waveform (5 bars pulsing 0-32px height)
- LIVE badge (red, pulsing)
- Timer (MM:SS)
- Mic/Camera toggles (round buttons)
- Emergency CTAs (Call 911, Share Location)

**Colors:**
- Primary: `#667eea` → `#764ba2` gradient
- Background: Purple gradient
- Chat white card with shadow
- User messages: Blue bubbles
- Assistant: Gray bubbles

## 📝 License

MIT - Use freely for your project!
