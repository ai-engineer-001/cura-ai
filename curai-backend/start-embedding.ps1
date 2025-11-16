#!/usr/bin/env pwsh

# Start Medical Dataset Embedding Pipeline
# Optimized for 260k vectors (~1.9 GB storage)

# Set all required environment variables
$env:OPENROUTER_API_KEY = "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"
$env:PINECONE_API_KEY = "pcsk_3pCQ8i_FNkw3Sw7eHTLvXXhX2ChSpq9XeactxNVcPHoNxuNkisvgnULVJHBtF2bAZxdePJ"
$env:PINECONE_INDEX_NAME = "default"
$env:PINECONE_ENVIRONMENT = "us-east-1-aws"
$env:OPENROUTER_EMBED_MODEL = "openai/text-embedding-3-small"
$env:EMBEDDING_DIMENSION = "1536"
$env:SITE_URL = "http://localhost:3000"
$env:EMBED_BATCH_SIZE = "50"
$env:BATCH_DELAY_MS = "1000"
$env:CONTINUE_ON_ERROR = "true"

# Dataset selection & size controls
$env:MAX_TOTAL_VECTORS = "260000"
$env:Q_TRUNCATE = "256"
$env:A_TRUNCATE = "512"
$env:C_TRUNCATE = "512"
$env:DATASET_PRIORITY = "medqa,bioasq,medmcqa"
$env:DATASET_INCLUDE = "medqa,bioasq,medmcqa"

# Change to backend directory and run
Set-Location -Path "d:\curaai-platform\curai-backend"
Write-Host "🚀 Starting embedding pipeline..." -ForegroundColor Cyan
Write-Host "   Target: 260,000 vectors (~1.9 GB)" -ForegroundColor Cyan
Write-Host "   Datasets: MedQA + BioASQ + MedMCQA (partial)" -ForegroundColor Cyan
Write-Host ""

node embed-datasets.js
