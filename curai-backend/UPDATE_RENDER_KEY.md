# ✅ CRITICAL UPDATE: New OpenRouter API Key

## API Key Updated Successfully

The OpenRouter API key has been updated to a working key:

```
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
```

✅ **Tested locally**: Working correctly

## 🚨 ACTION REQUIRED: Update Render Environment Variables

Since `.env` is in `.gitignore`, you MUST manually update Render:

### Step 1: Go to Render Dashboard

1. Visit: **https://dashboard.render.com**
2. Select your backend service
3. Click **"Environment"** in the left sidebar

### Step 2: Update the API Key

Find `OPENROUTER_API_KEY` and update its value to:

```
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
```

### Step 3: Also Add All Required Environment Variables

Make sure these are ALL set in Render:

```
OPENROUTER_API_KEY=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
PINECONE_API_KEY=pcsk_3pCQ8i_FNkw3Sw7eHTLvXXhX2ChSpq9XeactxNVcPHoNxuNkisvgnULVJHBtF2bAZxdePJ
PINECONE_INDEX_NAME=default
PINECONE_HOST=default-jvpb9gd.svc.aped-4627-b74a.pinecone.io
OPENROUTER_DEFAULT_MODEL=google/gemini-2.0-flash-exp:free
ALLOWED_ORIGINS=*
NODE_ENV=production
PORT=3000
PINECONE_ENVIRONMENT=us-east-1-aws
RAG_TOP_K=8
RAG_THRESHOLD_HIGH=0.80
RAG_THRESHOLD_PARTIAL=0.70
RAG_THRESHOLD_FALLBACK=0.60
SITE_URL=https://cura-ai-kjv1.onrender.com
```

### Step 4: Save and Redeploy

1. Click **"Save Changes"**
2. Render will auto-redeploy
3. Watch logs for: `[Server] OPENROUTER_API_KEY: ✓ SET (length: 73)`

## Expected Deployment Logs

After updating Render environment variables:

```
[Server] =================================================
[Server] Environment Variable Loading
[Server] =================================================
[Server] Looking for .env file at: /opt/render/project/src/.env
[Server] File exists: false
[Server] ℹ No .env file found - will use system environment variables
[Server] ℹ This is NORMAL for Render deployment
[Server] -------------------------------------------------
[Server] Current Environment Variables Status:
[Server] NODE_ENV: production
[Server] PORT: 3000
[Server] OPENROUTER_API_KEY: ✓ SET (length: 73)  ← Should show this now
[Server] PINECONE_API_KEY: ✓ SET (length: 88)    ← Should show this
[Server] PINECONE_HOST: default-jvpb9gd.svc.aped-4627-b74a.pinecone.io
[Server] PINECONE_INDEX_NAME: default
[Server] =================================================
✅ Server listening at http://0.0.0.0:3000
```

## Test After Deployment

```bash
# Health check
curl https://cura-ai-kjv1.onrender.com/health

# Chat endpoint
curl -X POST https://cura-ai-kjv1.onrender.com/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is diabetes?"}'
```

---

**Status**: Local `.env` updated ✅ | Render needs manual update ⏳
