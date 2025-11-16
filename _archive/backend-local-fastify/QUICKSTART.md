# ⚡ 30-Second Setup

## Prerequisites
- Node.js 18+ installed
- OpenRouter API key ([get free one](https://openrouter.ai/keys))

## Setup

1. **Install dependencies:**
```pwsh
cd backend-local
npm install
```

2. **Configure API key:**
```pwsh
Copy-Item .env.example .env
```

Edit `.env`:
```env
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
MODE=real
```

3. **Start backend:**
```pwsh
node src/server.js
```

4. **Open frontend:**
```pwsh
cd frontend-test
start index.html
```

## Test It

1. **Text Chat**: Type "Patient has chest pain" → press Enter
2. **Real-Time**: Click "Real-Time" button → allow mic → speak
3. **Watch**: LLM streams emergency guidance token-by-token

## Need Help?

- Backend not starting? Check port 4000 isn't in use
- No audio? Grant microphone permission in browser
- Not streaming? Verify OpenRouter key in `.env`

## What's Working?

✅ Real OpenRouter LLM streaming  
✅ WebSocket audio chunking (2-second intervals)  
✅ Token-by-token response rendering  
✅ Emergency UI with waveform animation  
⏳ ASR (mock transcription - add Whisper for real)

## Next Steps

- Add real Whisper ASR (replace mock transcription)
- Implement video streaming
- Add emergency call integration
- Deploy to production server

**Full docs:** See [README.md](README.md)
