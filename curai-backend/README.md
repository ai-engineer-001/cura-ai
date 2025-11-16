# Cura AI Backend

Production-ready Node.js backend for Cura AI medical assistant with OpenRouter models, Pinecone vector database, real-time audio streaming, and RAG (Retrieval-Augmented Generation) capabilities.

## 🚀 Quick Start

```bash
# 1. Clone and navigate
cd curai-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your API keys (see Configuration section)

# 4. Start development server
npm run dev

# 5. Test the server
npm run smoke
```

Server will be available at `http://localhost:3000`

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Pipeline Stages](#pipeline-stages)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Capabilities
- ✅ **RAG Pipeline**: Retrieve relevant medical knowledge from Pinecone, rerank, and generate contextual responses
- ✅ **Real-time Streaming**: WebSocket support for audio/text streaming with low latency
- ✅ **ASR Integration**: Local whisper.cpp support with OpenRouter fallback
- ✅ **TTS Support**: Edge-TTS integration for voice responses
- ✅ **Emergency Detection**: Automatic detection of critical keywords with escalated response
- ✅ **Safety Middleware**: Medical disclaimers, diagnosis prevention, rate limiting
- ✅ **Multi-Model Support**: Config-driven OpenRouter model selection per pipeline stage
- ✅ **Vector Search**: Pinecone integration with batch embedding and two-stage retrieval

### Safety Features
- 🛡️ Emergency keyword detection (40+ critical phrases)
- 🛡️ Automatic safety disclaimers
- 🛡️ No-diagnosis policy enforcement
- 🛡️ Rate limiting and input sanitization
- 🛡️ Graceful error handling and fallbacks

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │ (Next.js, HTML test UI)
│   (User)        │
└────────┬────────┘
         │
         ├─ REST API (/api/*)
         │    │
         │    ├─ /api/health          → Health check
         │    ├─ /api/search          → RAG pipeline
         │    ├─ /api/embed/batch     → Indexing
         │    └─ /api/realtime/*      → Session control
         │
         └─ WebSocket (/ws/realtime)
                  │
                  ├─ audio_chunk → ASR → Transcript
                  ├─ text_message → LLM → Streaming
                  └─ control → Start/Stop/Reset
         
┌─────────────────────────────────────────────────────┐
│               Backend Services                      │
├─────────────────────────────────────────────────────┤
│  OpenRouter     │  Pinecone       │  Whisper.cpp   │
│  (LLM/Embed)    │  (Vector DB)    │  (ASR)         │
└─────────────────────────────────────────────────────┘
```

### Data Flow: RAG Pipeline

```
User Query
    ↓
[1. Generate Query Embedding]
    ↓
[2. Dense Retrieval from Pinecone] (top 8)
    ↓
[3. Optional Reranking] (LLM or embedding-based)
    ↓
[4. Build Context from top 3]
    ↓
[5. Emergency Check]
    ↓
[6. Generate Response] (OpenRouter streaming)
    ↓
[7. Apply Safety Checks & Disclaimer]
    ↓
Response to User
```

---

## ⚙️ Configuration

### Required API Keys

Copy `.env.example` to `.env` and configure:

```bash
# REQUIRED: OpenRouter API (for LLM and embeddings)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# REQUIRED: Pinecone API (for vector storage)
PINECONE_API_KEY=pcsk_your-key-here
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=curai-embeddings
```

### Model Configuration

Configure models per pipeline stage (all via OpenRouter):

```bash
# Default model for RAG generation (free tier recommended)
OPENROUTER_DEFAULT_MODEL=google/gemini-2.0-flash-exp:free

# Embedding model (text-embedding-3-small recommended)
OPENROUTER_EMBED_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536

# Fallback model for non-critical flows
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3.1-8b-instruct:free

# High-capacity model for medical verification
OPENROUTER_MEDICAL_MODEL=nousresearch/hermes-3-llama-3.1-405b:free

# Real-time streaming model (low latency)
OPENROUTER_STREAMING_MODEL=google/gemini-2.0-flash-exp:free
```

### Optional: ASR Configuration

```bash
# Local whisper.cpp path (for offline transcription)
WHISPER_CPP_PATH=/usr/local/bin/whisper
WHISPER_MODEL_PATH=/usr/local/share/whisper/ggml-base.en.bin

# Enable fallback to OpenRouter if local whisper.cpp fails
ASR_FALLBACK_ENABLED=true
```

### Optional: RAG Tuning

```bash
# Two-stage retrieval configuration
RAG_TOP_K=8                    # Documents retrieved in dense search
RAG_RERANK_TOP_K=3             # Documents used after reranking
RAG_RERANK_ENABLED=true        # Enable reranking
RAG_RERANK_STRATEGY=llm        # Options: llm, embedding, none
```

---

## 📡 API Endpoints

### Health Check

```bash
GET /api/health
```

**Response:**
```json
{
  "ok": true,
  "status": "healthy",
  "time": "2025-01-15T10:30:00.000Z",
  "environment": {
    "pineconeConfigured": true,
    "openrouterConfigured": true
  }
}
```

---

### RAG Search

```bash
POST /api/search
Content-Type: application/json

{
  "query": "What should I do if someone is choking?",
  "sessionId": "optional-session-id",
  "topK": 5
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session-123",
  "query": "What should I do if someone is choking?",
  "sources": [
    {
      "id": "choking-heimlich",
      "score": 0.92,
      "text": "If someone is choking and cannot breathe...",
      "metadata": { "source": "corpus-upload" }
    }
  ],
  "response": "If someone is choking:\n1. Ask if they can speak...",
  "emergency": false,
  "model": "google/gemini-2.0-flash-exp:free",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Emergency Detection:**
If query contains critical keywords (e.g., "not breathing", "unresponsive"), response will include:
```json
{
  "emergency": true,
  "response": "🚨 CALL 911 IMMEDIATELY...[detailed emergency instructions]"
}
```

---

### Batch Embedding & Indexing

```bash
POST /api/embed/batch
Content-Type: application/json

{
  "items": [
    {
      "id": "doc-1",
      "text": "CPR instructions: Push hard and fast on center of chest...",
      "metadata": { "category": "emergency", "severity": "critical" }
    },
    {
      "id": "doc-2",
      "text": "For minor cuts, wash with soap and water..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "itemsProcessed": 2,
  "result": { "upsertedCount": 2 }
}
```

---

### Real-time Session Control

**Start Session:**
```bash
POST /api/realtime/start
Content-Type: application/json

{
  "sessionId": "rt-session-123",
  "language": "en"
}
```

**Stop Session:**
```bash
POST /api/realtime/stop
Content-Type: application/json

{
  "sessionId": "rt-session-123"
}
```

---

### WebSocket Real-time Streaming

**Connect:**
```
ws://localhost:3000/ws/realtime?sessionId=your-session-id
```

**Message Types:**

1. **Audio Chunk** (from client):
```json
{
  "type": "audio_chunk",
  "data": "<base64-encoded-audio>",
  "format": "webm"
}
```

2. **Text Message** (from client):
```json
{
  "type": "text_message",
  "text": "What are the signs of a heart attack?"
}
```

3. **Control** (from client):
```json
{
  "type": "control",
  "action": "start" | "stop" | "reset"
}
```

4. **Transcript** (from server):
```json
{
  "type": "transcript",
  "text": "What are the signs",
  "partial": true
}
```

5. **LLM Token** (from server):
```json
{
  "type": "llm_token",
  "content": "The signs"
}
```

---

## 🔧 Pipeline Stages

### 1. ASR (Automatic Speech Recognition)

**Primary:** Local whisper.cpp  
**Fallback:** OpenRouter transcription endpoint

```javascript
import { transcribeChunk } from "./services/asr.js";

const text = await transcribeChunk(base64Audio, "webm");
```

### 2. Embedding Generation

**Model:** `text-embedding-3-small` (via OpenRouter)  
**Dimension:** 1536

```javascript
import { embedText } from "./services/embedding-helper.js";

const embedding = await embedText("CPR instructions...");
```

### 3. Vector Search & Retrieval

**Database:** Pinecone  
**Strategy:** Two-stage (dense retrieval + LLM reranking)

```javascript
import { queryVector } from "./services/pinecone.js";

const results = await queryVector(queryEmbedding, topK);
```

### 4. RAG Generation

**Models:**
- Default: `google/gemini-2.0-flash-exp:free`
- Emergency: `nousresearch/hermes-3-llama-3.1-405b:free`

```javascript
import { runRag } from "./services/rag.js";

const result = await runRag({ query, emergency: true });
```

### 5. TTS (Text-to-Speech)

**Provider:** Edge-TTS (Microsoft)  
**Voices:** 6+ voices (en-US, en-GB, en-AU, en-IN)

```javascript
import { synthesizeSpeech } from "./services/tts.js";

const audioBuffer = await synthesizeSpeech(text, { voice: "en-US-AriaNeural" });
```

---

## 🛠️ Development

### Project Structure

```
curai-backend/
├── src/
│   ├── server.js              # Main Fastify server
│   ├── routes/
│   │   ├── health.js          # Health check
│   │   ├── embed.js           # Embedding/indexing endpoints
│   │   ├── search.js          # RAG query endpoints
│   │   └── realtime.js        # Session control
│   ├── services/
│   │   ├── openrouter.js      # OpenRouter API wrapper
│   │   ├── pinecone.js        # Pinecone vector DB wrapper
│   │   ├── asr.js             # ASR (whisper.cpp + fallback)
│   │   ├── rag.js             # RAG pipeline
│   │   ├── tts.js             # TTS integration
│   │   └── embedding-helper.js # Embedding generation
│   ├── ws/
│   │   └── ws-server.js       # WebSocket server
│   ├── middleware/
│   │   ├── emergency-detect.js # Emergency keyword detection
│   │   └── safety.js          # Safety policies & disclaimers
│   └── scripts/
│       ├── embed-corpus.js    # Batch indexing script
│       └── sample-data/       # Sample medical documents
├── tests/
│   ├── smoke.sh               # Bash smoke tests
│   └── ws-test-client.js      # WebSocket test client
├── package.json
├── .env.example
└── README.md
```

### Running Development Server

```bash
# Start with auto-reload
npm run dev

# Start production
npm start

# Run smoke tests
npm run smoke

# Test WebSocket
npm run test:ws
```

### Adding New Documents to Index

```bash
# Place .txt or .md files in src/scripts/sample-data/
# Then run embedding script
npm run embed

# Or specify custom folder
node src/scripts/embed-corpus.js /path/to/your/documents

# With chunking for large documents
node src/scripts/embed-corpus.js /path/to/docs --chunk --chunk-size=1000
```

---

## 🧪 Testing

### Smoke Tests (REST API)

```bash
npm run smoke

# Or manually
bash tests/smoke.sh
```

**Tests:**
1. Health check
2. Batch embedding
3. Normal RAG query
4. Emergency query detection
5. Real-time session start/stop

### WebSocket Tests

```bash
npm run test:ws

# Or manually
node tests/ws-test-client.js
```

**Tests:**
1. Connection establishment
2. Text message streaming
3. Audio chunk processing
4. Control messages (start/stop/reset)
5. Session finalization

### Manual Testing with curl

**Health Check:**
```bash
curl http://localhost:3000/api/health | jq
```

**RAG Query:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the steps for CPR?"}' | jq
```

**Emergency Query:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Someone collapsed and is not breathing!"}' | jq
```

---

## 🚀 Deployment

### Environment Setup

1. **Production .env:**
```bash
# Use production Pinecone environment
PINECONE_ENVIRONMENT=us-east-1-aws

# Disable debug logging
LOG_LEVEL=info
DEBUG=false

# Enable request logging
REQUEST_LOGGING=true

# Set timeout limits
REQUEST_TIMEOUT=30000
```

2. **Install dependencies:**
```bash
npm install --production
```

3. **Start with PM2 (recommended):**
```bash
npm install -g pm2
pm2 start src/server.js --name curai-backend
pm2 save
pm2 startup
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

```bash
docker build -t curai-backend .
docker run -p 3000:3000 --env-file .env curai-backend
```

---

## 🐛 Troubleshooting

### "OPENROUTER_API_KEY not configured"

**Solution:** Add your OpenRouter API key to `.env`:
```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### "PINECONE_API_KEY not configured"

**Solution:** Add your Pinecone API key to `.env`:
```bash
PINECONE_API_KEY=pcsk_your-key-here
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=curai-embeddings
```

### "Embedding generation not yet implemented"

**Solution:** Set MOCK_MODE for testing without embeddings:
```bash
MOCK_MODE=true
```

Or configure proper embedding model in `.env`:
```bash
EMBEDDING_PROVIDER=openai
OPENROUTER_EMBED_MODEL=text-embedding-3-small
```

### Whisper.cpp not found

**Solution:** Either:
1. Install whisper.cpp and set path in `.env`
2. Enable fallback: `ASR_FALLBACK_ENABLED=true`
3. Skip ASR features (text-only mode)

### Pinecone "Index not found"

**Solution:** Create Pinecone index first:
1. Go to [pinecone.io](https://pinecone.io)
2. Create new index with dimension 1536
3. Update `PINECONE_INDEX_NAME` in `.env`

### Rate Limiting Errors

**Solution:** Adjust batch size and delays:
```bash
EMBED_BATCH_SIZE=25         # Reduce from 50
BATCH_DELAY_MS=2000         # Increase from 1000
```

---

## 📖 Additional Resources

- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Whisper.cpp GitHub](https://github.com/ggerganov/whisper.cpp)
- [Edge-TTS](https://github.com/rany2/edge-tts)
- [Fastify Documentation](https://www.fastify.io/)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

1. Follow existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure safety middleware is applied to all medical endpoints

---

**Questions or Issues?** Open an issue on GitHub or contact the development team.
