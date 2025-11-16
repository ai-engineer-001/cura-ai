# Environment Configuration

## ✅ Unified .env File Approach

This backend now uses **a single `.env` file** for all environments (local development and production).

### Why This Change?

- **Simplicity**: One file to manage instead of multiple (.env.local, .env.production, etc.)
- **Reliability**: No build script failures when copying files
- **Consistency**: Same configuration source for all deployments
- **Easier Debugging**: Single source of truth for all environment variables

### Setup Instructions

1. **The `.env` file already exists** in the backend root with all required configurations
2. **No action needed** - the file is pre-configured with your API keys
3. **For local development**, change these values in `.env`:
   ```bash
   NODE_ENV=development
   LOG_LEVEL=debug
   SITE_URL=http://localhost:3000
   ```

4. **For production (Render)**, keep these values in `.env`:
   ```bash
   NODE_ENV=production
   LOG_LEVEL=info
   SITE_URL=https://cura-ai-kjv1.onrender.com
   ```

### How It Works

The `src/server.js` file loads environment variables with this logic:

```javascript
// Load unified .env file
const envPath = path.resolve(__dirname, '../.env');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('[Server] ✓ Loaded unified .env file');
} else {
  console.warn('[Server] ⚠ No .env file found - using system environment variables');
}

// Verify critical variables are loaded
const requiredVars = ['OPENROUTER_API_KEY', 'PINECONE_API_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`[Server] ❌ Missing required environment variables`);
  process.exit(1);
}
```

### Deployment Checklist

- ✅ Single `.env` file contains all configurations
- ✅ Code loads `.env` directly (no build script needed)
- ✅ Server validates required API keys on startup
- ✅ Clear console logging shows which env file is loaded
- ✅ Old separate env files removed (.env.local, .env.production)

### Files Removed

- `❌ .env.local` (merged into `.env`)
- `❌ .env.production` (merged into `.env`)

### Files Updated

- ✅ `.env` (unified configuration)
- ✅ `src/server.js` (simplified env loading)
- ✅ `package.json` (removed build script)
- ✅ `.gitignore` (updated comments)

### Expected Server Logs

When the server starts, you'll see:

```
[Server] ✓ Loaded unified .env file
[Server] Environment: production
[Server] Port: 3000
```

If environment variables are missing:

```
[Server] ❌ Missing required environment variables: OPENROUTER_API_KEY, PINECONE_API_KEY
[Server] Please ensure .env file exists with all required keys
```

### Troubleshooting

**Problem**: Server says "No .env file found"
- **Solution**: Ensure `.env` file exists in `curai-backend/` directory

**Problem**: "Missing required environment variables"
- **Solution**: Check that `.env` contains `OPENROUTER_API_KEY` and `PINECONE_API_KEY`

**Problem**: 401 authentication errors
- **Solution**: Verify API keys in `.env` are valid and not expired
