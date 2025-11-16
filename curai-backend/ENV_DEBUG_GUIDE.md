# Environment Variables Flow - Debugging Guide

## 🔍 How Environment Variables Are Loaded

### 1. Entry Point: `src/server.js` (Lines 13-53)

```javascript
// Step 1: Look for .env file
const envPath = path.resolve(__dirname, '../.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });  // Load from file
} else {
  // Use system environment variables (Render sets these)
}

// Step 2: Validate required variables
const requiredVars = ['OPENROUTER_API_KEY', 'PINECONE_API_KEY'];
if (missingVars.length > 0) {
  process.exit(1);  // Exit if missing
}
```

### 2. Where API Keys Are Used

#### PINECONE_API_KEY Used In:
- `src/services/pinecone.js:26` - Main Pinecone service
- `src/routes/embed.js:72, 94` - Embedding routes
- `src/scripts/embed-corpus.js:210` - Dataset embedding scripts

#### OPENROUTER_API_KEY Used In:
- `src/services/openrouter.js:9, 14` - Main OpenRouter service
- `src/services/embedding-helper.js:69, 82, 106, 119` - Embedding generation
- `src/services/emergency-response.js` - Emergency LLM calls

## 🚨 Current Issue: Render Deployment

### Problem
```
[Server] ℹ No .env file found - using system environment variables (normal for Render)
[Server] ❌ Missing required environment variables: PINECONE_API_KEY
```

### Root Cause
The `.env` file is in `.gitignore` → not pushed to GitHub → not available on Render.

Render needs environment variables set in its dashboard.

## ✅ Solution: Set Variables in Render Dashboard

### Step-by-Step Fix

1. **Go to Render Dashboard**
   - URL: https://dashboard.render.com
   - Login with your account

2. **Select Your Service**
   - Click on your backend service (e.g., "cura-ai" or "curai-backend")

3. **Open Environment Settings**
   - In the left sidebar, click **"Environment"**

4. **Add Missing Variables**
   
   Click **"Add Environment Variable"** for each:

   ```
   Key: OPENROUTER_API_KEY
   Value: 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
   
   Key: PINECONE_API_KEY
   Value: pcsk_3pCQ8i_FNkw3Sw7eHTLvXXhX2ChSpq9XeactxNVcPHoNxuNkisvgnULVJHBtF2bAZxdePJ
   
   Key: PINECONE_INDEX_NAME
   Value: default
   
   Key: PINECONE_HOST
   Value: default-jvpb9gd.svc.aped-4627-b74a.pinecone.io
   
   Key: OPENROUTER_DEFAULT_MODEL
   Value: google/gemini-2.0-flash-exp:free
   
   Key: ALLOWED_ORIGINS
   Value: *
   
   Key: NODE_ENV
   Value: production
   
   Key: PORT
   Value: 3000
   ```

5. **Save and Wait**
   - Click **"Save Changes"** at the bottom
   - Render will automatically redeploy (takes 1-2 minutes)

## 🎯 Expected Success Logs

After adding environment variables, you should see:

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
[Server] OPENROUTER_API_KEY: ✓ SET (length: 88)
[Server] PINECONE_API_KEY: ✓ SET (length: 88)
[Server] PINECONE_HOST: default-jvpb9gd.svc.aped-4627-b74a.pinecone.io
[Server] PINECONE_INDEX_NAME: default
[Server] =================================================
[Server] Server listening at http://0.0.0.0:3000
✅ Deployment successful!
```

## 🔧 Verification Commands

### Test Locally (with .env file)
```bash
cd curai-backend
npm start
```

### Test Render Endpoint
```bash
# Health check
curl https://cura-ai-kjv1.onrender.com/health

# Chat API
curl -X POST https://cura-ai-kjv1.onrender.com/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is diabetes?"}'
```

## 📊 Environment Variable Flow Diagram

```
Local Development:
  .env file → dotenv.config() → process.env.* → services/

Render Production:
  Render Dashboard Env Vars → System Environment → process.env.* → services/
```

## 🐛 Troubleshooting Checklist

- [ ] Verified .env file exists locally (for local testing)
- [ ] Added OPENROUTER_API_KEY to Render dashboard
- [ ] Added PINECONE_API_KEY to Render dashboard
- [ ] Added PINECONE_HOST to Render dashboard
- [ ] Added PINECONE_INDEX_NAME to Render dashboard
- [ ] Clicked "Save Changes" in Render
- [ ] Waited for Render to redeploy
- [ ] Checked Render logs for "✓ SET" messages
- [ ] Tested health endpoint: `/health`
- [ ] Tested chat endpoint: `/api/search`

## 📖 Related Files

- `curai-backend/.env` - Local development configuration
- `curai-backend/RENDER_ENV_SETUP.md` - Complete variable list
- `curai-backend/render-env-setup.sh` - Copy-paste script
- `src/server.js:13-53` - Environment loading logic
- `src/services/pinecone.js:26` - PINECONE_API_KEY usage
- `src/services/openrouter.js:9` - OPENROUTER_API_KEY usage

---

**Next Action**: Add environment variables to Render dashboard as shown above.
