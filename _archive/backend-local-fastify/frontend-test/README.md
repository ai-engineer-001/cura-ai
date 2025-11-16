# Cura AI Frontend Test UI

Real-time emergency chat interface with voice streaming support.

## Features

- **Bottom-centered chat input** with auto-grow textarea
- **Real-Time streaming mode** with live audio capture
- **WebSocket integration** for low-latency streaming
- **OpenRouter LLM** streaming responses
- **Emergency controls** (Call 911, Share Location)
- **Waveform visualization** during voice capture
- **Medical-themed design** (blue gradient, clean UI)

## Quick Start

1. **Start backend** (from `backend-local/`):
```bash
cd backend-local
npm run dev
```

2. **Open frontend** (from `frontend-test/`):
```bash
# Open in browser (any local server)
npx serve .
# Or just open index.html directly in Chrome/Firefox
```

3. **Add OpenRouter API key**:
Edit `backend-local/.env`:
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
MODE=real
```

## Usage

### Text Chat
1. Type message in bottom input
2. Press Enter or click Send button
3. AI streams response token-by-token

### Real-Time Voice Mode
1. Click **Real-Time** button (bottom right)
2. Allow microphone access
3. Speak naturally - audio sent in 2-second chunks
4. Transcription appears + AI responds with streaming
5. Click X or **Real-Time** again to stop

### Emergency Actions
- **Call 911**: Placeholder for emergency call integration
- **Share Location**: Placeholder for geolocation sharing
- **Mic/Camera toggles**: Control audio/video streams

## Technical Details

### WebSocket Protocol

**Client → Server:**
```json
// Start streaming
{ "type": "control", "action": "start_realtime" }

// Audio chunk (webm-opus base64)
{ "type": "audio_chunk", "seq": 1, "audio_format": "webm-opus", "payload": "<base64>" }

// Text message
{ "type": "text_message", "text": "Patient needs help" }
```

**Server → Client:**
```json
// Transcription
{ "type": "transcription", "interim": false, "text": "Patient needs help" }

// Streaming token
{ "type": "assistant_token", "token": "Stay calm" }

// Final response
{ "type": "assistant_final", "text": "Stay calm and call 911" }
```

### Audio Capture
- **MediaRecorder API** with webm-opus codec
- **2-second chunks** sent via WebSocket
- **Base64 encoding** for JSON transport
- **Auto-stop** on silence detection (planned)

### LLM Streaming
- **OpenRouter API** with SSE streaming
- **Token-by-token** rendering in UI
- **Conversation history** maintained in backend
- **Model**: `meta-llama/llama-3.3-8b-instruct:free`

## Testing Checklist

- [ ] Backend starts on port 4000
- [ ] Frontend loads and connects
- [ ] Demo token acquired automatically
- [ ] Text messages send/receive
- [ ] Real-Time button activates overlay
- [ ] Microphone permission requested
- [ ] Audio chunks sent to backend
- [ ] Transcription appears in chat
- [ ] LLM response streams token-by-token
- [ ] Stop Real-Time closes overlay

## Known Limitations

- **ASR**: Currently mock transcription (no Whisper integration yet)
- **Camera**: Video toggle present but not implemented
- **VAD**: No voice activity detection yet
- **Error handling**: Basic error states shown

## Next Steps

1. Integrate Whisper API for real ASR
2. Add VAD for smart chunking
3. Implement camera video streaming
4. Add TTS for voice responses
5. Emergency call flow integration
6. Location sharing with geolocation API
