# Resume Embedding from Interruption

## Quick Resume

Your embedding stopped at **MedQA record 25100**. To continue:

```bash
# Already configured in .env:
# DATASET_SKIP=medqa:25100

# Just restart the embedding script:
cd d:\curaai-platform\curai-backend
.\start-embedding.ps1
```

## How It Works

The script now checks the `DATASET_SKIP` environment variable and skips already-processed records:

1. **Reads skip configuration**: `medqa:25100` means "skip first 25100 records of MedQA"
2. **Resumes from that point**: Starts processing from record 25101
3. **Maintains correct IDs**: Vector IDs use actual record index (not batch index)

## Status of Datasets

Based on your interruption at 25100/62745 (40% of MedQA):

```
✅ MedMCQA: Completed (all 182,822 records processed)
⏸️  MedQA: Stopped at 25100 of 62,745 (40% done)
⏹️  MedQuAD: Not started yet (47,457 records)
⏹️  PubMedQA: Not started yet (160,019 records)
⏹️  BioASQ: Not started yet (approx. records)
```

## Update Skip Offsets

If you need to skip records in multiple datasets:

```bash
# Edit .env:
DATASET_SKIP=medqa:25100,pubmedqa:0,bioasq:0

# Or skip multiple datasets:
DATASET_SKIP=medqa:62745,pubmedqa:10000,bioasq:5000
```

## Verify Resume Works

Check the console output when you restart:

```
📄 Processing: medqa.jsonl
  📍 Resuming from record 25100 (skipping 25100 already processed)
  Records: 62745 (processing 37645)
  Progress: 25100/62745 (40.0%) | Rate: 8.0/s | ETA: 78m 15s | Errors: 0
```

## Important Notes

1. **Vector IDs won't duplicate**: The script uses `datasetName_recordIndex`, so `medqa_25100` is unique
2. **No re-embedding**: Pinecone will skip if ID already exists (upsert behavior)
3. **Continue on error**: Set `CONTINUE_ON_ERROR=true` if you want to keep going despite errors
4. **Progress tracking**: The progress bar will show correct percentages

## Troubleshooting

### "Already exists" errors
```bash
# Pinecone may reject duplicate IDs if they already exist
# This is normal - the script will continue
```

### Want to re-process from scratch?
```bash
# Remove the DATASET_SKIP line from .env
# Or set it to 0:
DATASET_SKIP=medqa:0,pubmedqa:0
```

### Check what's already in Pinecone
```bash
node check-pinecone-stats.js
```

This will show you the current vector count and help verify if the resume worked.

## After Completion

Once all datasets are processed:

1. **Remove DATASET_SKIP** from `.env` (or comment it out)
2. **Verify total count**: Run `node check-pinecone-stats.js`
3. **Test RAG**: Open `frontend-test.html` and try medical queries

---

**Current Configuration**: Ready to resume MedQA from record 25100 ✅
