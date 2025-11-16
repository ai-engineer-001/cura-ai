# Cura AI Real-Time Backend

Node.js WebSocket server for real-time voice/video streaming, ASR, LLM, and emergency detection.

## Architecture

```
Browser MediaRecorder → WebSocket → Node.js Backend
  ├── Audio: webm-opus chunks (250ms) → Whisper ASR → Text
  ├── Video: 320×240 JPEG frames (1.5s) → Scene analysis (TODO)
  └── Text: Emergency detection → OpenRouter LLM → Stream response
```

## Features

- **Real-time audio streaming**: MediaRecorder webm-opus → Whisper transcription
- **Video frame capture**: Canvas JPEG frames for scene analysis
- **LLM streaming**: OpenRouter token-by-token responses
- **Emergency detection**: Keyword-based urgency scoring (0-10)
- **State machine**: LISTENING → DETECTING_URGENCY → SUGGEST_CALL → CONTINUE_UNTIL_HELP
- **Session persistence**: Redis-backed conversation history

## Setup

### 1. Install Dependencies

```bash
cd backend-realtime
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Server
NODE_ENV=development
PORT=8080
JWT_SECRET=your-secret-key-change-in-production

# Redis (optional - falls back to in-memory)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# OpenAI Whisper ASR
OPENAI_API_KEY=sk-...

# OpenRouter LLM
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Emergency Detection
URGENCY_THRESHOLD=5
EMERGENCY_KEYWORDS=chest pain,heart attack,can't breathe,unconscious,bleeding,choking,seizure
```

### 3. Start Redis (Optional)

If using Redis for session persistence:

```bash
docker run -d -p 6379:6379 redis
```

Otherwise, sessions use in-memory Map.

### 4. Run Server

**Development**:
```bash
npm run dev
```

**Production**:
```bash
npm start
```

Server runs on `ws://localhost:8080`.

## WebSocket Protocol

### Client → Server Messages

#### Audio Chunk
```json
{
  "type": "audio_chunk",
  "seq": 1,
  "audio_format": "webm-opus",
  "payload": "base64_audio_data"
}
```

#### Video Frame
```json
{
  "type": "video_frame",
  "ts": 1234567890,
  "payload": "base64_jpeg_data"
}
```

#### Text Message
```json
{
  "type": "text_message",
  "text": "Patient has chest pain"
}
```

#### Control
```json
{
  "type": "control",
  "action": "start_realtime"
}
```

### Server → Client Messages

#### Transcription
```json
{
  "type": "transcription",
  "text": "Patient has chest pain",
  "interim": false,
  "seq": 1,
  "timestamp": 1234567890
}
```

#### Intermediate Response (LLM Streaming)
```json
{
  "type": "intermediate_response",
  "chunk": "I'm analyzing",
  "timestamp": 1234567890
}
```

#### Final Response
```json
{
  "type": "final_response",
  "text": "Complete LLM response...",
  "emergencyState": "SUGGEST_CALL",
  "timestamp": 1234567890
}
```

#### Emergency State Update
```json
{
  "type": "emergency_state_update",
  "state": "SUGGEST_CALL",
  "emergencyType": "cardiac",
  "urgency": 8,
  "keywords": ["chest pain", "heart attack"],
  "timestamp": 1234567890
}
```

#### Error
```json
{
  "type": "error",
  "message": "Processing failed",
  "timestamp": 1234567890
}
```

## Services

### SessionManager
- Redis-backed session storage with 24h TTL
- Conversation history (last 50 messages)
- Falls back to in-memory Map if Redis unavailable

### AudioProcessor
- Buffers webm-opus chunks (base64)
- Transcribes via OpenAI Whisper when buffer ≥ 100KB
- Returns text transcription

### VideoProcessor
- Receives 320×240 JPEG frames
- Scene analysis TODO (ML model integration)

### LLMService
- OpenRouter streaming completions
- Async generator yields tokens
- Emergency response templates

### EmergencyDetector
- Keyword detection from `EMERGENCY_KEYWORDS`
- Urgency scoring (0-10 scale)
- State machine transitions

## Emergency States

1. **LISTENING**: Default, waiting for keywords
2. **DETECTING_URGENCY**: Keywords detected, calculating urgency
3. **PROVIDING_GUIDANCE**: Low urgency (< threshold), providing first-aid
4. **SUGGEST_CALL**: High urgency (≥ threshold), recommending 911/108/112
5. **CONTINUE_UNTIL_HELP**: Call placed, guiding until help arrives
6. **END**: Emergency services arrived

## Testing

### Mock Client Example

```javascript
const WebSocket = require('ws');
const fs = require('fs');

// Connect with JWT token
const ws = new WebSocket('ws://localhost:8080?token=your_jwt_token');

ws.on('open', () => {
  console.log('Connected');
  
  // Send audio chunk
  const audioData = fs.readFileSync('test_audio.webm');
  ws.send(JSON.stringify({
    type: 'audio_chunk',
    seq: 1,
    audio_format: 'webm-opus',
    payload: audioData.toString('base64')
  }));
  
  // Send text message
  ws.send(JSON.stringify({
    type: 'text_message',
    text: 'Patient has severe chest pain'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message.type, message);
});
```

### Test Scenarios

Create 3 recorded test cases:

1. **Choking Scenario**:
   - Audio: "The patient is choking and can't breathe"
   - Expected: `urgency = 8`, `state = SUGGEST_CALL`, `emergencyType = CHOKING`

2. **Fainting Scenario**:
   - Audio: "They are unconscious and not responsive"
   - Expected: `urgency = 9`, `state = SUGGEST_CALL`, `emergencyType = UNCONSCIOUS`

3. **Stroke Scenario**:
   - Audio: "Face drooping, arm weak, speech slurred"
   - Expected: `urgency = 9`, `state = SUGGEST_CALL`, `emergencyType = GENERAL`

## Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t cura-realtime .
docker run -p 8080:8080 --env-file .env cura-realtime
```

### Systemd Service

```ini
[Unit]
Description=Cura AI Real-Time Backend
After=network.target

[Service]
Type=simple
User=cura
WorkingDirectory=/opt/cura-realtime
EnvironmentFile=/opt/cura-realtime/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Performance

- **Latency**: 200-500ms (audio buffering + Whisper + LLM first token)
- **Throughput**: 100+ concurrent WebSocket connections
- **Audio Buffer**: 100KB threshold (~5-10 seconds at 16kbps webm-opus)
- **Video FPS**: 0.67 fps (1 frame every 1.5s)

## Security

- JWT authentication on WebSocket connection
- API keys stored server-side only
- Session TTL: 24 hours
- No client-side sensitive data

## Monitoring

Logs written to:
- `logs/error.log` - Errors only
- `logs/combined.log` - All logs

Winston JSON format:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "WebSocket connected",
  "sessionId": "abc123",
  "connectionId": "abc123_1234567890"
}
```

## Troubleshooting

### Audio not transcribing
- Check `OPENAI_API_KEY` is set
- Verify audio chunks are base64-encoded webm-opus
- Confirm buffer reaches 100KB threshold

### LLM not streaming
- Check `OPENROUTER_API_KEY` is valid
- Verify model name (`OPENROUTER_MODEL`)
- Check logs for SSE parsing errors

### Emergency detection not triggering
- Verify keywords in `EMERGENCY_KEYWORDS` env var
- Lower `URGENCY_THRESHOLD` (default: 5)
- Check logs for detected keywords

### Redis connection failed
- Server falls back to in-memory Map
- Check `REDIS_URL` and `REDIS_PASSWORD`
- Verify Redis is running: `redis-cli ping`

## License

MIT
