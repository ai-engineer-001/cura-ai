# 🚀 Cura AI Backend - Quick Start Guide

Get your backend running in 5 minutes!

---

## Step 1: Install Dependencies

```bash
cd curai-backend
npm install
```

**Expected output:**
```
added 150 packages in 15s
```

---

## Step 2: Add Your API Keys

Open `.env` file and add your two API keys:

```bash
# OpenRouter API Key (get from: https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Pinecone API Key (get from: https://app.pinecone.io/)
PINECONE_API_KEY=pcsk_your-key-here
```

**Where to get keys:**
- **OpenRouter**: https://openrouter.ai/keys (free tier available)
- **Pinecone**: https://app.pinecone.io/ (free tier: 1 index, 100K vectors)

---

## Step 3: Create Pinecone Index

1. Go to https://app.pinecone.io/
2. Click "Create Index"
3. Settings:
   - **Name**: `curai-embeddings`
   - **Dimensions**: `1536`
   - **Metric**: `cosine`
   - **Cloud**: AWS
   - **Region**: `us-east-1`
4. Update `.env` if you used different settings:
   ```bash
   PINECONE_INDEX_NAME=your-index-name
   PINECONE_ENVIRONMENT=your-region
   ```

---

## Step 4: Start the Server

```bash
npm run dev
```

**Expected output:**
```
[INFO] Server listening at http://0.0.0.0:3000
  HTTP:      http://localhost:3000
  WebSocket: ws://localhost:3000/ws/realtime
```

---

## Step 5: Test the Server

### Option A: Health Check (Browser)

Open in browser:
```
http://localhost:3000/api/health
```

Should return:
```json
{
  "ok": true,
  "status": "healthy",
  "environment": {
    "pineconeConfigured": true,
    "openrouterConfigured": true
  }
}
```

### Option B: Run Smoke Tests (Terminal)

```bash
# In a new terminal
npm run smoke
```

**Expected output:**
```
✅ Health check passed
✅ Embed batch passed
✅ Normal RAG query passed
✅ Emergency detection passed
✅ Real-time session start passed
```

---

## Step 6: Index Sample Medical Data

```bash
npm run embed
```

This will:
1. Read sample medical documents from `src/scripts/sample-data/`
2. Generate embeddings using OpenRouter
3. Upload to Pinecone

**Expected output:**
```
📄 Found 3 files to process
🔄 Processing batch 1/1 (3 items)
✅ Batch 1 uploaded successfully
✨ Embedding complete! 3 documents processed
```

---

## Step 7: Test RAG Query

### curl (Terminal):
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What should I do if someone is choking?"}'
```

### PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/search" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"query": "What should I do if someone is choking?"}'
```

**Expected response:**
```json
{
  "success": true,
  "sources": [
    {
      "id": "choking-heimlich",
      "score": 0.92,
      "text": "If someone is choking..."
    }
  ],
  "response": "If someone is choking:\n1. Ask if they can speak...",
  "emergency": false
}
```

---

## Step 8: Test Emergency Detection

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Help! Someone collapsed and is not breathing!"}'
```

**Expected response:**
```json
{
  "success": true,
  "emergency": true,
  "response": "🚨 CALL 911 IMMEDIATELY...\n\n1. Call emergency services now...",
  "model": "nousresearch/hermes-3-llama-3.1-405b:free"
}
```

---

## Step 9: Test WebSocket (Optional)

```bash
npm run test:ws
```

**Expected output:**
```
✅ WebSocket connection established
📤 Sending text message...
📝 Transcript: What should I do...
✅ LLM response complete
```

---

## 🎉 You're Ready!

Your backend is now:
- ✅ Running on `http://localhost:3000`
- ✅ Connected to OpenRouter for LLM
- ✅ Connected to Pinecone for vector search
- ✅ Detecting emergencies automatically
- ✅ Streaming responses via WebSocket

---

## Next Steps

### 1. Add More Medical Documents

```bash
# Create .txt files in src/scripts/sample-data/
# Then re-run embedding
npm run embed
```

### 2. Connect Your Frontend

Update your frontend to use:
- **REST API**: `http://localhost:3000/api/search`
- **WebSocket**: `ws://localhost:3000/ws/realtime`

See `README.md` for API documentation.

### 3. Configure Models

Edit `.env` to change models:
```bash
# Use different model for streaming
OPENROUTER_STREAMING_MODEL=meta-llama/llama-3.3-8b-instruct:free

# Use Voyage AI embeddings instead of OpenAI
EMBEDDING_PROVIDER=voyage
VOYAGE_API_KEY=your-voyage-key
```

### 4. Enable Local Whisper.cpp (Optional)

```bash
# Install whisper.cpp
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make

# Download model
bash ./models/download-ggml-model.sh base.en

# Update .env
WHISPER_CPP_PATH=/path/to/whisper.cpp/main
WHISPER_MODEL_PATH=/path/to/whisper.cpp/models/ggml-base.en.bin
```

---

## Troubleshooting

### "OPENROUTER_API_KEY not configured"
- Check `.env` file has your API key
- Restart server: `Ctrl+C` then `npm run dev`

### "Pinecone index not found"
- Create index at https://app.pinecone.io/
- Use dimension `1536` for text-embedding-3-small
- Update `PINECONE_INDEX_NAME` in `.env`

### "No matches found in Pinecone"
- Run `npm run embed` to index sample data
- Wait a few seconds for Pinecone to index
- Try query again

### Server won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Use different port
PORT=3001 npm run dev
```

---

## 📚 Full Documentation

See `README.md` for:
- Complete API reference
- Architecture diagrams
- Deployment guides
- Advanced configuration
- Integration examples

---

**Ready to build amazing medical AI features!** 🚀
