# 🏥 Cura AI RAG Frontend + Backend

Complete working medical assistant with **Pinecone-powered RAG** and **real-time voice support**.

---

## 🚀 Quick Start

### 1. Start Backend + Frontend

```pwsh
cd d:\curaai-platform\curai-backend
.\start-rag-demo.ps1
```

This will:
- Launch Fastify backend on `http://localhost:3000`
- Open `frontend-test.html` in your browser
- Connect to your Pinecone index with embedded medical knowledge

### 2. Manual Start

**Backend:**
```pwsh
cd d:\curaai-platform\curai-backend
npm run dev
```

**Frontend:**
Open `frontend-test.html` in your browser (double-click or drag to browser).

---

## 🧪 Testing the RAG System

### Text-Based RAG Search

1. **Default mode** is RAG Search (text input)
2. Type a medical question: 
   - *"What are the symptoms of type 2 diabetes?"*
   - *"How do you treat acute myocardial infarction?"*
   - *"Explain the pathophysiology of heart failure"*
3. Click **Search** or press `Enter`
4. View:
   - **AI Response** (generated from retrieved context)
   - **Sources** card showing matching medical Q&A pairs from Pinecone
   - **Match scores** (cosine similarity %)

### Real-Time Voice Mode

1. Click **Real-Time** radio button
2. Click **Start Real-Time Voice Mode**
3. Allow microphone access
4. Speak your medical question
5. System will:
   - Transcribe audio (ASR)
   - Run RAG search
   - Generate response
   - Synthesize speech (TTS)

### Emergency Mode

1. Check **🚨 Emergency Mode** checkbox
2. Ask emergency-related question
3. Response will prioritize:
   - Immediate life-saving actions
   - "CALL 911" prompt
   - Lower temperature (more deterministic)
   - Emergency-optimized model

---

## 📊 Backend Endpoints

### RAG Search
```http
POST http://localhost:3000/api/search
Content-Type: application/json

{
  "query": "What are the symptoms of diabetes?",
  "emergency": false,
  "topK": 5
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session-1234567890",
  "query": "What are the symptoms of diabetes?",
  "sources": [
    {
      "id": "medqa_12345",
      "score": 0.89,
      "text": "Question: What are common symptoms...",
      "metadata": { "dataset": "medqa", "source": "medqa_train" }
    }
  ],
  "response": "Type 2 diabetes symptoms include...",
  "emergency": false,
  "model": "meta-llama/llama-3.3-70b-instruct",
  "timestamp": "2025-11-16T..."
}
```

### Pinecone Stats
```http
GET http://localhost:3000/api/embed/stats
```

**Response:**
```json
{
  "success": true,
  "indexName": "default",
  "vectorCount": 150000,
  "dimension": 1536,
  "namespaces": 0,
  "host": "default-xxx.svc.pinecone.io"
}
```

### Health Check
```http
GET http://localhost:3000/health
```

### WebSocket Real-Time
```
ws://localhost:3000/ws/realtime?sessionId=xyz
```

---

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (HTML/JS)                       │
│  - Text input → POST /api/search                           │
│  - Voice input → WebSocket /ws/realtime                    │
│  - Display: Response + Sources + Metadata                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Fastify Backend (Node.js)                  │
│  Routes:                                                     │
│    - POST /api/search      → RAG pipeline                   │
│    - GET  /api/embed/stats → Pinecone stats                │
│    - WS   /ws/realtime     → Voice streaming               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      RAG Service                            │
│  1. Generate query embedding (OpenRouter)                   │
│  2. Retrieve top-K vectors (Pinecone)                      │
│  3. Extract metadata (Q/A/context)                         │
│  4. Build prompt with retrieved context                    │
│  5. Generate response (OpenRouter LLM)                     │
│  6. Return: response + sources + scores                    │
└─────────────────────────────────────────────────────────────┘
              │                              │
              ▼                              ▼
   ┌─────────────────────┐       ┌─────────────────────┐
   │  OpenRouter API     │       │  Pinecone Index     │
   │  - Embeddings       │       │  - 260k vectors     │
   │  - LLM Generation   │       │  - Medical Q&A      │
   │  - Streaming        │       │  - Metadata rich    │
   └─────────────────────┘       └─────────────────────┘
```

---

## 🧠 RAG Pipeline Details

### Step 1: Query Embedding
- Model: `openai/text-embedding-3-small` (1536 dims)
- Input: User question text
- Output: Dense vector representation

### Step 2: Dense Retrieval (Pinecone)
- Query vector against 260k medical Q&A pairs
- Cosine similarity search
- Retrieve top-K (default 5) matches
- Include metadata: question, answer, source, dataset

### Step 3: Context Building
- Extract text from matched vectors
- Format: `[Source N] Question: ... Answer: ...`
- Combine top-3 (configurable) sources

### Step 4: LLM Generation
- System prompt: Safety rules + first-aid guidance
- User prompt: Context + Question + Instructions
- Model: `meta-llama/llama-3.3-70b-instruct` (default)
- Temperature: 0.3 (0.1 for emergency)

### Step 5: Response Assembly
- AI-generated answer
- Source citations with scores
- Metadata (timestamps, model, emergency flag)

---

## 📁 Key Files

```
curai-backend/
├── frontend-test.html          ← Open this in browser
├── start-rag-demo.ps1           ← Quick launcher script
├── src/
│   ├── server.js                ← Fastify server
│   ├── routes/
│   │   ├── search.js            ← POST /api/search (RAG)
│   │   └── embed.js             ← GET /api/embed/stats
│   ├── services/
│   │   ├── rag.js               ← RAG pipeline orchestration
│   │   ├── pinecone.js          ← Vector search
│   │   ├── openrouter.js        ← LLM + embeddings
│   │   ├── embedding-helper.js  ← Embedding wrapper
│   │   ├── asr.js               ← Speech-to-text
│   │   └── tts.js               ← Text-to-speech
│   ├── middleware/
│   │   ├── emergency-detect.js  ← Keyword detection
│   │   └── safety.js            ← Response sanitization
│   └── ws/
│       └── ws-server.js         ← WebSocket handler
├── embed-datasets.js            ← Dataset embedding script
├── check-pinecone-stats.js      ← Check vector count
└── .env                         ← API keys + config
```

---

## 🐛 Troubleshooting

### "Backend Offline" in Frontend

**Check backend is running:**
```pwsh
curl http://localhost:3000/health
```

**Start backend manually:**
```pwsh
cd d:\curaai-platform\curai-backend
npm run dev
```

### "No matches found in Pinecone"

**Check vector count:**
```pwsh
node check-pinecone-stats.js
```

**If 0 vectors, run embedding:**
```pwsh
.\start-embedding.ps1
```

### CORS Errors

Frontend must be opened via:
- File protocol (`file:///...`)
- Or served from same origin

Backend already has CORS enabled for `localhost`.

### Real-Time Mode Not Working

1. Check WebSocket connection in browser console
2. Ensure microphone permissions granted
3. Check backend logs for WebSocket events

---

## 🎯 Example Queries

### General Medical Questions
- "What causes high blood pressure?"
- "Explain the difference between Type 1 and Type 2 diabetes"
- "What are the risk factors for stroke?"

### Clinical Scenarios
- "A patient presents with chest pain radiating to the left arm. What should I consider?"
- "Describe the management of acute asthma exacerbation"
- "What are the diagnostic criteria for sepsis?"

### Emergency Situations (check Emergency Mode)
- "Someone is unconscious and not breathing. What do I do?"
- "How do I perform CPR?"
- "What are the steps for managing severe bleeding?"

---

## 📈 Performance Metrics

- **Query latency:** ~2-4 seconds (embedding + retrieval + generation)
- **Embedding generation:** ~200ms per query
- **Pinecone retrieval:** ~300-500ms for top-5
- **LLM generation:** ~1-3 seconds (streaming available)
- **Total vectors:** 260,000 (capped for 2GB free tier)
- **Storage used:** ~1.9 GB

---

## 🔐 Security Notes

- **Never use for actual medical diagnosis**
- **Always recommend consulting healthcare professionals**
- **Emergency mode includes 911 prompt**
- **Response safety middleware active**
- **Input sanitization enabled**

---

## 🚀 Next Steps

1. ✅ Verify backend running: `http://localhost:3000/health`
2. ✅ Check Pinecone stats: `node check-pinecone-stats.js`
3. ✅ Open `frontend-test.html` in browser
4. ✅ Test RAG search with medical question
5. ✅ Review sources + match scores
6. ✅ Try emergency mode
7. ✅ Test real-time voice mode (optional)

---

**Built with:**
- **Fastify** - Fast Node.js web framework
- **Pinecone** - Vector database (serverless)
- **OpenRouter** - LLM API aggregator
- **Embeddings**: text-embedding-3-small (OpenAI)
- **LLM**: llama-3.3-70b-instruct (Meta)
- **Datasets**: MedQA, BioASQ, MedMCQA

🏥 **Ready for medical AI assistance!**
