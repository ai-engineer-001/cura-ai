#!/bin/bash
# =============================================================================
# Render Environment Variables Setup Script
# =============================================================================
# Copy these environment variables to your Render dashboard:
# https://dashboard.render.com/web/YOUR_SERVICE/env
# =============================================================================

echo "📋 REQUIRED Environment Variables for Render"
echo "=============================================="
echo ""
echo "Copy and paste these into Render Dashboard > Environment:"
echo ""

cat << 'EOF'
# Core API Keys (REQUIRED)
OPENROUTER_API_KEY=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
PINECONE_API_KEY=pcsk_3pCQ8i_FNkw3Sw7eHTLvXXhX2ChSpq9XeactxNVcPHoNxuNkisvgnULVJHBtF2bAZxdePJ

# Environment Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
HOST=0.0.0.0

# Pinecone Configuration
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=default
PINECONE_HOST=default-jvpb9gd.svc.aped-4627-b74a.pinecone.io

# OpenRouter Model Configuration
OPENROUTER_DEFAULT_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_MEDICAL_MODEL=nousresearch/hermes-3-llama-3.1-405b:free
OPENROUTER_STREAMING_MODEL=google/gemini-2.0-flash-exp:free

# CORS Configuration
ALLOWED_ORIGINS=*

# RAG Configuration
RAG_TOP_K=8
RAG_RERANK_TOP_K=3
RAG_RERANK_ENABLED=true
RAG_RERANK_STRATEGY=llm
RAG_THRESHOLD_HIGH=0.80
RAG_THRESHOLD_PARTIAL=0.70
RAG_THRESHOLD_FALLBACK=0.60

# ASR & TTS Configuration
WHISPER_CPP_PATH=/usr/local/bin/whisper
ASR_FALLBACK_ENABLED=true
TTS_PROVIDER=edge-tts

# Safety & Privacy
CONSENT=false
EMERGENCY_DETECTION_ENABLED=true

# Logging
REQUEST_LOGGING=true

# Embedding Configuration
CONTINUE_ON_ERROR=false
BATCH_DELAY_MS=1000
EMBEDDING_PROVIDER=openai
EMBEDDING_DIMENSION=1536

# Site Configuration
SITE_NAME=Cura AI Medical Assistant
SITE_URL=https://cura-ai-kjv1.onrender.com
EOF

echo ""
echo "=============================================="
echo "✅ Steps to add these to Render:"
echo "1. Go to: https://dashboard.render.com"
echo "2. Select your service: cura-ai"
echo "3. Click 'Environment' in the left sidebar"
echo "4. Click 'Add Environment Variable'"
echo "5. Copy/paste each KEY=VALUE pair above"
echo "6. Click 'Save Changes'"
echo "7. Render will auto-redeploy"
echo "=============================================="
