# Render Environment Variables Setup Guide

## 🚨 Problem: .env file not deployed to Render

The `.env` file is in `.gitignore`, so it doesn't get pushed to GitHub and deployed to Render. This is **normal and secure** - we should use Render's environment variables instead.

## ✅ Solution: Set Environment Variables in Render Dashboard

### Step 1: Go to Render Dashboard

1. Visit: https://dashboard.render.com
2. Select your service: **cura-ai** (or whatever your backend service is named)
3. Click **"Environment"** in the left sidebar

### Step 2: Add Environment Variables

Click **"Add Environment Variable"** and add each of these:

#### 🔑 Core API Keys (REQUIRED)

```
OPENROUTER_API_KEY=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
PINECONE_API_KEY=pcsk_3pCQ8i_FNkw3Sw7eHTLvXXhX2ChSpq9XeactxNVcPHoNxuNkisvgnULVJHBtF2bAZxdePJ
```

#### ⚙️ Server Configuration

```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
HOST=0.0.0.0
```

#### 📊 Pinecone Configuration

```
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=default
PINECONE_HOST=default-jvpb9gd.svc.aped-4627-b74a.pinecone.io
```

#### 🤖 OpenRouter Model Configuration

```
OPENROUTER_DEFAULT_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_MEDICAL_MODEL=nousresearch/hermes-3-llama-3.1-405b:free
OPENROUTER_STREAMING_MODEL=google/gemini-2.0-flash-exp:free
```

#### 🌐 CORS Configuration

```
ALLOWED_ORIGINS=*
```

#### 🔍 RAG Configuration

```
RAG_TOP_K=8
RAG_RERANK_TOP_K=3
RAG_RERANK_ENABLED=true
RAG_RERANK_STRATEGY=llm
RAG_THRESHOLD_HIGH=0.80
RAG_THRESHOLD_PARTIAL=0.70
RAG_THRESHOLD_FALLBACK=0.60
```

#### 🎤 ASR & TTS Configuration

```
WHISPER_CPP_PATH=/usr/local/bin/whisper
ASR_FALLBACK_ENABLED=true
TTS_PROVIDER=edge-tts
```

#### 🛡️ Safety & Privacy

```
CONSENT=false
EMERGENCY_DETECTION_ENABLED=true
```

#### 📝 Logging & Monitoring

```
REQUEST_LOGGING=true
```

#### 🔢 Embedding Configuration

```
CONTINUE_ON_ERROR=false
BATCH_DELAY_MS=1000
EMBEDDING_PROVIDER=openai
EMBEDDING_DIMENSION=1536
```

#### 🌍 Site Configuration

```
SITE_NAME=Cura AI Medical Assistant
SITE_URL=https://cura-ai-kjv1.onrender.com
```

### Step 3: Save and Redeploy

1. Click **"Save Changes"** at the bottom
2. Render will automatically **redeploy** your service
3. Watch the deploy logs for success messages

## ✅ Expected Deploy Logs

After adding environment variables, you should see:

```
[Server] ℹ No .env file found - using system environment variables (normal for Render)
[Server] ✓ Environment: production
[Server] ✓ Port: 3000
[Server] Server listening at http://0.0.0.0:3000
```

## 🎯 Quick Copy-Paste Format

If Render supports bulk import, use this format:

```bash
OPENROUTER_API_KEY=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
PINECONE_API_KEY=pcsk_3pCQ8i_FNkw3Sw7eHTLvXXhX2ChSpq9XeactxNVcPHoNxuNkisvgnULVJHBtF2bAZxdePJ
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
HOST=0.0.0.0
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=default
PINECONE_HOST=default-jvpb9gd.svc.aped-4627-b74a.pinecone.io
OPENROUTER_DEFAULT_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_MEDICAL_MODEL=nousresearch/hermes-3-llama-3.1-405b:free
OPENROUTER_STREAMING_MODEL=google/gemini-2.0-flash-exp:free
ALLOWED_ORIGINS=*
RAG_TOP_K=8
RAG_RERANK_TOP_K=3
RAG_RERANK_ENABLED=true
RAG_RERANK_STRATEGY=llm
RAG_THRESHOLD_HIGH=0.80
RAG_THRESHOLD_PARTIAL=0.70
RAG_THRESHOLD_FALLBACK=0.60
WHISPER_CPP_PATH=/usr/local/bin/whisper
ASR_FALLBACK_ENABLED=true
TTS_PROVIDER=edge-tts
CONSENT=false
EMERGENCY_DETECTION_ENABLED=true
REQUEST_LOGGING=true
CONTINUE_ON_ERROR=false
BATCH_DELAY_MS=1000
EMBEDDING_PROVIDER=openai
EMBEDDING_DIMENSION=1536
SITE_NAME=Cura AI Medical Assistant
SITE_URL=https://cura-ai-kjv1.onrender.com
```

## 🐛 Troubleshooting

### Still seeing "Missing required environment variables"?

1. **Check spelling**: Ensure variable names are EXACT (case-sensitive)
2. **No quotes**: Don't wrap values in quotes in Render dashboard
3. **No spaces**: Make sure there's no space around the `=` sign
4. **Save changes**: Click "Save Changes" button at the bottom
5. **Wait for redeploy**: Render needs to redeploy after saving

### How to verify variables are set?

Add a temporary test endpoint or check logs for environment variable values (don't log API keys in production!)

## 📚 References

- [Render Environment Variables Documentation](https://render.com/docs/environment-variables)
- [Render Dashboard](https://dashboard.render.com)

---

**Status**: Ready to configure Render environment variables ✅
