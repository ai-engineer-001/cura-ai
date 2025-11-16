# Medical Dataset Embedding Guide

## ✅ Setup Complete

All scripts and configuration files have been created. Your backend is fully configured with:

- ✅ OpenRouter API connected (embeddings via `openai/text-embedding-3-small`)
- ✅ Pinecone index `default` created (1536-d, cosine metric)
- ✅ Normalized medical datasets ready in `../curaai-datasets/datasets/normalized/`
- ✅ Embedding pipeline script created: `embed-datasets.js`

## 📊 Available Datasets

The following normalized datasets will be processed:

1. **bioasq_dev_rag.jsonl** - 4,948 records
2. **bioasq_rag.jsonl** - BioASQ training data
3. **bioasq_train.jsonl** - BioASQ full training set
4. **medmcqa_train.jsonl** - Medical MCQ dataset
5. **medqa_all.jsonl** - Complete MedQA dataset
6. **medqa_train.jsonl** - MedQA training split
7. **medquad_all.jsonl** - MedQuAD complete collection
8. **medquad_rag.jsonl** - MedQuAD RAG-optimized
9. **pubmedqa_train.jsonl** - PubMedQA training data

**Estimated Total**: ~50,000-100,000 medical Q&A pairs

## 🚀 How to Run Embedding

### Method 1: Using npm (Recommended)

```powershell
# Open a FRESH PowerShell window (important!)
cd d:\curaai-platform\curai-backend

# Run the embedding pipeline
npm run embed:datasets
```

### Method 2: Direct node execution

```powershell
# Open a FRESH PowerShell window
cd d:\curaai-platform\curai-backend
node embed-datasets.js
```

### Method 3: Test with sample data first

```powershell
cd d:\curaai-platform\curai-backend
node test-embedding.js
```

## ⚙️ Configuration

All settings are in `.env`:

```env
# Embedding Configuration
OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
EMBEDDING_DIMENSION=1536
EMBEDDING_PROVIDER=openai

# Pinecone
PINECONE_INDEX_NAME=default
PINECONE_ENVIRONMENT=us-east-1-aws

# Performance
EMBED_BATCH_SIZE=50           # Process 50 records at a time
BATCH_DELAY_MS=1000           # 1 second delay between batches
CONTINUE_ON_ERROR=false       # Stop on first error
```

## 📈 What the Pipeline Does

1. **Loads normalized datasets** from `curaai-datasets/datasets/normalized/`
2. **Generates embeddings** via OpenRouter for each Q&A pair
3. **Uploads to Pinecone** with structured metadata:
   - `question` - The medical question
   - `answer` - The answer or response
   - `context` - Additional context if available
   - `dataset` - Source dataset name
   - `source` - Original data source
   - `split` - train/dev/test split info

4. **Progress tracking** with:
   - Real-time progress bar
   - Processing rate (records/sec)
   - ETA remaining
   - Error count

5. **Verification** - Checks final Pinecone stats

## ⏱️ Expected Duration

- **Batch size**: 50 records
- **Delay**: 1 second between batches
- **Rate**: ~50 records/second
- **Total**: ~50,000-100,000 records

**Estimated time**: 20-40 minutes depending on dataset size

## 🔍 Monitoring Progress

The script outputs:

```
═══════════════════════════════════════════════════════
  Medical Dataset Embedding Pipeline
═══════════════════════════════════════════════════════

⚙️  Configuration:
  Embedding Model: openai/text-embedding-3-small
  Embedding Dimension: 1536
  Pinecone Index: default
  Batch Size: 50
  Batch Delay: 1000ms

📍 Resolving Pinecone index...
  Host: default-jvpb9gd.svc.aped-4627-b74a.pinecone.io

📚 Found 9 dataset files:
  - bioasq_dev_rag.jsonl
  - bioasq_rag.jsonl
  ...

📄 Processing: bioasq_dev_rag.jsonl
  Records: 4948
  Progress: 2500/4948 (50.5%) | Rate: 48.2/s | ETA: 51s | Errors: 0
```

## ✅ Verification

After completion, the script shows:

```
═══════════════════════════════════════════════════════
  Embedding Complete
═══════════════════════════════════════════════════════

📊 Statistics:
  Total Records Processed: 87,450
  Total Errors: 0

📂 Per Dataset:
  ✅ bioasq_dev_rag: 4,948 records (0 errors)
  ✅ medmcqa_train: 18,234 records (0 errors)
  ...

📍 Verifying Pinecone index...
  Total Vectors: 87,450
  Dimension: 1536

🎉 Pipeline complete! Your medical knowledge base is ready.
```

## 🧪 Testing RAG After Embedding

Once embedding is complete, test your RAG pipeline:

```powershell
# Start the backend
npm run dev

# In another terminal, test search
curl -X POST http://localhost:3000/search `
  -H "Content-Type: application/json" `
  -d '{"query": "What are the symptoms of type 2 diabetes?"}'
```

Expected response:
```json
{
  "query": "What are the symptoms of type 2 diabetes?",
  "contexts": [
    {
      "question": "What are common diabetes symptoms?",
      "answer": "Common symptoms include...",
      "score": 0.89,
      "source": "medquad_rag"
    }
  ],
  "response": "The symptoms of type 2 diabetes include...",
  "metadata": {
    "retrieval_count": 3,
    "emergency_detected": false
  }
}
```

## 🔧 Troubleshooting

### Issue: "User not found" (401 error)

**Cause**: PowerShell environment has cached old API keys

**Fix**:
1. Close ALL PowerShell windows
2. Open a FRESH PowerShell window
3. Run the embedding command

### Issue: "Index not found"

**Cause**: Pinecone index name mismatch

**Fix**:
```powershell
# Verify index exists
cd d:\curaai-platform\curai-backend
node create-pinecone-index.js
```

### Issue: Rate limit errors

**Cause**: Too many requests to OpenRouter

**Fix**: Increase `BATCH_DELAY_MS` in `.env`:
```env
BATCH_DELAY_MS=2000  # 2 seconds instead of 1
```

### Issue: Out of memory

**Cause**: Processing too many records at once

**Fix**: Reduce `EMBED_BATCH_SIZE` in `.env`:
```env
EMBED_BATCH_SIZE=25  # 25 instead of 50
```

## 📝 Notes

- The embedding process is **idempotent** - you can re-run it safely
- Pinecone will overwrite existing vectors with the same ID
- To start fresh, delete and recreate the Pinecone index
- Monitor your OpenRouter usage at https://openrouter.ai/activity
- Monitor Pinecone usage at https://app.pinecone.io/

## 🎯 Next Steps After Embedding

1. ✅ Test RAG search endpoint
2. ✅ Adjust `RAG_TOP_K` in `.env` for optimal retrieval
3. ✅ Test real-time streaming via WebSocket
4. ✅ Connect your frontend application
5. ✅ Deploy to production

## 📚 Additional Resources

- **Backend API Docs**: See `README.md`
- **Frontend Integration**: See `FRONTEND_INTEGRATION.md`
- **Quick Start**: See `QUICKSTART.md`
- **RAG Configuration**: Edit `.env` RAG settings

---

**Ready to proceed?** Run `npm run embed:datasets` in a fresh PowerShell window!
