#!/usr/bin/env node

/**
 * Production Dataset Embedding Pipeline
 * 
 * Processes normalized medical datasets from curaai-datasets/datasets/normalized/
 * Generates embeddings via OpenRouter (text-embedding-3-small)
 * Uploads to Pinecone with structured metadata
 * 
 * Features:
 * - Batch processing with rate limiting
 * - Progress tracking with ETA
 * - Error recovery and retry logic
 * - Deduplication support
 * - Comprehensive metadata preservation
 */

import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const PINECONE_CTRL_URL = 'https://api.pinecone.io';

const BATCH_SIZE = parseInt(process.env.EMBED_BATCH_SIZE) || 50;
const BATCH_DELAY_MS = parseInt(process.env.BATCH_DELAY_MS) || 1000;
const CONTINUE_ON_ERROR = process.env.CONTINUE_ON_ERROR === 'true';
// Global vector cap (set MAX_TOTAL_VECTORS to stop before exceeding storage limits)
const MAX_TOTAL_VECTORS = parseInt(process.env.MAX_TOTAL_VECTORS || '0');
// Metadata truncation (smaller values reduce Pinecone storage footprint)
const Q_MAX = parseInt(process.env.Q_TRUNCATE || '256');
const A_MAX = parseInt(process.env.A_TRUNCATE || '512');
const C_MAX = parseInt(process.env.C_TRUNCATE || '512');
// Dataset selection controls
const DATASET_INCLUDE = (process.env.DATASET_INCLUDE || '').split(',').map(s => s.trim()).filter(Boolean);
const DATASET_EXCLUDE = (process.env.DATASET_EXCLUDE || '').split(',').map(s => s.trim()).filter(Boolean);
const DATASET_PRIORITY = (process.env.DATASET_PRIORITY || '').split(',').map(s => s.trim()).filter(Boolean);

// Resume functionality - skip already processed records
// Format: "medqa:25100,pubmedqa:0,bioasq:0"
const DATASET_SKIP = {};
if (process.env.DATASET_SKIP) {
  process.env.DATASET_SKIP.split(',').forEach(entry => {
    const [dataset, count] = entry.split(':');
    if (dataset && count) {
      DATASET_SKIP[dataset.trim().toLowerCase()] = parseInt(count);
    }
  });
}

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Progress tracker
class ProgressTracker {
  constructor(total) {
    this.total = total;
    this.current = 0;
    this.startTime = Date.now();
    this.errors = 0;
  }

  update(count = 1) {
    this.current += count;
    const percent = ((this.current / this.total) * 100).toFixed(1);
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.current / elapsed;
    const remaining = (this.total - this.current) / rate;
    
    const eta = remaining > 60 
      ? `${Math.floor(remaining / 60)}m ${Math.floor(remaining % 60)}s`
      : `${Math.floor(remaining)}s`;
    
    process.stdout.write(`\r  Progress: ${this.current}/${this.total} (${percent}%) | Rate: ${rate.toFixed(1)}/s | ETA: ${eta} | Errors: ${this.errors}  `);
  }

  error() {
    this.errors++;
  }

  finish() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    console.log(`\n  Completed in ${elapsed.toFixed(1)}s`);
    if (this.errors > 0) {
      log(`  Errors: ${this.errors}`, 'yellow');
    }
  }
}

// Generate embeddings via OpenRouter
async function generateEmbeddings(texts, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        `${OPENROUTER_BASE_URL}/embeddings`,
        {
          model: process.env.OPENROUTER_EMBED_MODEL,
          input: texts
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
            'X-Title': 'Cura AI Embeddings'
          },
          timeout: 60000
        }
      );
      
      return response.data.data.map(item => item.embedding);
    } catch (error) {
      if (attempt === retries - 1) throw error;
      
      const delay = Math.pow(2, attempt) * 1000;
      log(`  Retry ${attempt + 1}/${retries} after ${delay}ms...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Get Pinecone index host
async function getPineconeHost() {
  const response = await axios.get(`${PINECONE_CTRL_URL}/indexes`, {
    headers: { 'Api-Key': process.env.PINECONE_API_KEY },
    timeout: 10000
  });
  
  const indexes = response.data?.indexes || response.data || [];
  const index = indexes.find(i => i.name === process.env.PINECONE_INDEX_NAME);
  
  if (!index) {
    throw new Error(`Index "${process.env.PINECONE_INDEX_NAME}" not found`);
  }
  
  return index.host || index.hosts?.controller || index?.spec?.host;
}

// Upload vectors to Pinecone
async function upsertToPinecone(host, vectors, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await axios.post(
        `https://${host}/vectors/upsert`,
        { vectors },
        {
          headers: {
            'Api-Key': process.env.PINECONE_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );
      return;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Load JSONL file
function loadJSONL(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

// Process a single dataset file
async function processDataset(filePath, datasetName, pineconeHost, remainingCapacity) {
  log(`\n📄 Processing: ${path.basename(filePath)}`, 'cyan');
  
  const records = loadJSONL(filePath);
  const totalRecords = records.length;
  
  // Check if we should skip records (resume functionality)
  const skipCount = DATASET_SKIP[datasetName.toLowerCase()] || 0;
  const startIndex = skipCount;
  
  if (skipCount > 0) {
    log(`  📍 Resuming from record ${skipCount} (skipping ${skipCount} already processed)`, 'yellow');
  }
  
  log(`  Records: ${totalRecords} (processing ${totalRecords - skipCount})`, 'blue');
  
  const effectiveCount = remainingCapacity > 0 
    ? Math.min(totalRecords - skipCount, remainingCapacity) 
    : totalRecords - skipCount;
    
  if (remainingCapacity > 0 && effectiveCount < (totalRecords - skipCount)) {
    log(`  Applying global cap: limiting to ${effectiveCount} of ${totalRecords - skipCount} remaining records`, 'yellow');
  }
  
  if (effectiveCount === 0) {
    log(`  Skipping - no records to process`, 'yellow');
    return { processed: 0, errors: 0 };
  }
  
  const progress = new ProgressTracker(effectiveCount);
  let totalErrors = 0;
  
  // Process in batches (starting from skipCount index)
  for (let i = startIndex; i < startIndex + effectiveCount; i += BATCH_SIZE) {
    const batchEnd = Math.min(i + BATCH_SIZE, startIndex + effectiveCount);
    const batch = records.slice(i, batchEnd);
    
    try {
      // Prepare texts for embedding
      const texts = batch.map(record => {
        // Normalize field names (different datasets use different keys)
        const question = record.question || record.instruction || '';
        const answer = record.answer || record.response || '';
        const context = record.context || '';
        
        // Combine question and answer/context for richer embeddings
        if (answer) {
          return `Question: ${question}\n\nAnswer: ${answer}`;
        } else if (context) {
          return `Question: ${question}\n\nContext: ${context}`;
        } else {
          return question;
        }
      });
      
      // Generate embeddings
      const embeddings = await generateEmbeddings(texts);
      
      // Prepare vectors for Pinecone
      const vectors = batch.map((record, idx) => {
        const id = `${datasetName}_${record.id || `${i + idx}`}`;
        
        // Normalize field names
        const question = record.question || record.instruction || '';
        const answer = record.answer || record.response || '';
        const context = record.context || '';
        
        // Clean metadata (Pinecone limits)
        const metadata = {
          dataset: datasetName,
          type: record.type || 'qa',
          source: record.source || record.dataset || datasetName
        };
        
        // Add question (truncated)
        if (question) {
          metadata.question = question.substring(0, Q_MAX);
          if (question.length > Q_MAX) metadata.question_truncated = true;
        }
        if (answer) {
          metadata.answer = answer.substring(0, A_MAX);
          if (answer.length > A_MAX) metadata.answer_truncated = true;
          metadata.answer_len = answer.length;
        }
        if (context) {
          metadata.context = context.substring(0, C_MAX);
          if (context.length > C_MAX) metadata.context_truncated = true;
        }
        
        // Add additional fields (safely)
        if (record.subject) metadata.subject = String(record.subject).substring(0, 200);
        if (record.cop) metadata.cop = String(record.cop).substring(0, 200);
        if (record.exp) metadata.exp = String(record.exp).substring(0, 400);
        if (record.opa) metadata.opa = String(record.opa).substring(0, 200);
        if (record.choice_type) metadata.choice_type = String(record.choice_type);
        if (record.split) metadata.split = String(record.split);
        if (record.explanation) metadata.explanation = String(record.explanation).substring(0, 1000);
        
        return {
          id,
          values: embeddings[idx],
          metadata
        };
      });
      
      // Upload to Pinecone
      await upsertToPinecone(pineconeHost, vectors);
      
      progress.update(batch.length);
      
      // Rate limiting
      if (i + BATCH_SIZE < effectiveCount) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
      
    } catch (error) {
      totalErrors++;
      progress.error();
      
      log(`\n  Error in batch ${i}-${i + batch.length}: ${error.message}`, 'red');
      
      if (!CONTINUE_ON_ERROR) {
        throw error;
      }
    }
  }
  
  progress.finish();
  
  return {
    processed: effectiveCount - totalErrors * BATCH_SIZE,
    errors: totalErrors
  };
}

// Main pipeline
async function main() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('  Medical Dataset Embedding Pipeline', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  // Configuration summary
  log('\n⚙️  Configuration:', 'magenta');
  log(`  Embedding Model: ${process.env.OPENROUTER_EMBED_MODEL}`, 'blue');
  log(`  Embedding Dimension: ${process.env.EMBEDDING_DIMENSION}`, 'blue');
  log(`  Pinecone Index: ${process.env.PINECONE_INDEX_NAME}`, 'blue');
  log(`  Batch Size: ${BATCH_SIZE}`, 'blue');
  log(`  Batch Delay: ${BATCH_DELAY_MS}ms`, 'blue');
  log(`  Continue on Error: ${CONTINUE_ON_ERROR}`, 'blue');
  if (MAX_TOTAL_VECTORS > 0) {
    log(`  Max Total Vectors: ${MAX_TOTAL_VECTORS}`, 'blue');
  }
  log(`  Truncation (Q/A/C): ${Q_MAX}/${A_MAX}/${C_MAX}`, 'blue');
  if (DATASET_INCLUDE.length) log(`  Include patterns: ${DATASET_INCLUDE.join(', ')}`, 'blue');
  if (DATASET_EXCLUDE.length) log(`  Exclude patterns: ${DATASET_EXCLUDE.join(', ')}`, 'blue');
  if (DATASET_PRIORITY.length) log(`  Priority order: ${DATASET_PRIORITY.join(', ')}`, 'blue');
  
  // Resolve Pinecone host
  log('\n📍 Resolving Pinecone index...', 'cyan');
  const pineconeHost = await getPineconeHost();
  log(`  Host: ${pineconeHost}`, 'green');
  
  // Find normalized datasets
  const datasetsDir = path.join(__dirname, '..', '..', 'curaai-datasets', 'datasets', 'normalized');
  
  if (!fs.existsSync(datasetsDir)) {
    log(`\n❌ Datasets directory not found: ${datasetsDir}`, 'red');
    process.exit(1);
  }
  
  let files = fs.readdirSync(datasetsDir)
    .filter(f => f.endsWith('.jsonl'))
    .filter(f => f.includes('train') || f.includes('all') || f.includes('rag')) // Focus on training/complete data
    .sort();
  // Apply include/exclude filters
  if (DATASET_INCLUDE.length) {
    files = files.filter(f => DATASET_INCLUDE.some(p => f.toLowerCase().includes(p.toLowerCase())));
  }
  if (DATASET_EXCLUDE.length) {
    files = files.filter(f => !DATASET_EXCLUDE.some(p => f.toLowerCase().includes(p.toLowerCase())));
  }
  // Apply priority ordering: files matching earlier priority terms come first
  if (DATASET_PRIORITY.length) {
    const weight = (fname) => {
      const lower = fname.toLowerCase();
      const idx = DATASET_PRIORITY.findIndex(p => lower.includes(p.toLowerCase()));
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };
    files.sort((a, b) => weight(a) - weight(b) || a.localeCompare(b));
  }
  
  log(`\n📚 Found ${files.length} dataset files:`, 'cyan');
  files.forEach(f => log(`  - ${f}`, 'blue'));
  
  // Process each dataset
  const stats = {
    totalProcessed: 0,
    totalErrors: 0,
    datasets: []
  };
  
  for (const file of files) {
    if (MAX_TOTAL_VECTORS > 0 && stats.totalProcessed >= MAX_TOTAL_VECTORS) {
      log(`\n🔒 Reached max vector cap (${MAX_TOTAL_VECTORS}). Stopping further dataset processing.`, 'yellow');
      break;
    }
    const filePath = path.join(datasetsDir, file);
    const datasetName = file.replace('.jsonl', '');
    const remaining = MAX_TOTAL_VECTORS > 0 ? (MAX_TOTAL_VECTORS - stats.totalProcessed) : 0;
    
    try {
      const result = await processDataset(filePath, datasetName, pineconeHost, remaining);
      stats.totalProcessed += result.processed;
      stats.totalErrors += result.errors;
      stats.datasets.push({
        name: datasetName,
        processed: result.processed,
        errors: result.errors
      });
    } catch (error) {
      log(`\n❌ Failed to process ${file}: ${error.message}`, 'red');
      if (!CONTINUE_ON_ERROR) {
        process.exit(1);
      }
    }
  }
  
  // Final summary
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  Embedding Complete', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  log(`\n📊 Statistics:`, 'magenta');
  log(`  Total Records Processed: ${stats.totalProcessed}`, 'green');
  log(`  Total Errors: ${stats.totalErrors}`, stats.totalErrors > 0 ? 'yellow' : 'green');
  if (MAX_TOTAL_VECTORS > 0) {
    log(`  Vector Cap Applied: ${stats.totalProcessed}/${MAX_TOTAL_VECTORS} (${((stats.totalProcessed / MAX_TOTAL_VECTORS) * 100).toFixed(1)}%)`, 'green');
  }
  
  log(`\n📂 Per Dataset:`, 'magenta');
  stats.datasets.forEach(ds => {
    const icon = ds.errors > 0 ? '⚠️ ' : '✅';
    log(`  ${icon} ${ds.name}: ${ds.processed} records (${ds.errors} errors)`, ds.errors > 0 ? 'yellow' : 'green');
  });
  
  // Check Pinecone stats
  log(`\n📍 Verifying Pinecone index...`, 'cyan');
  try {
    const statsResp = await axios.post(
      `https://${pineconeHost}/describe_index_stats`,
      {},
      {
        headers: {
          'Api-Key': process.env.PINECONE_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const indexStats = statsResp.data;
    log(`  Total Vectors: ${indexStats.totalRecordCount || indexStats.total_vector_count || 0}`, 'green');
    log(`  Dimension: ${indexStats.dimension}`, 'green');
    
    if (indexStats.namespaces) {
      log(`  Namespaces: ${Object.keys(indexStats.namespaces).length}`, 'green');
    }
  } catch (error) {
    log(`  Could not fetch index stats: ${error.message}`, 'yellow');
  }
  
  log(`\n🎉 Pipeline complete! Your medical knowledge base is ready.`, 'green');
  log(`\n💡 Next steps:`, 'cyan');
  log(`  1. Start the backend: npm run dev`, 'blue');
  log(`  2. Test RAG search: POST /search with a medical question`, 'blue');
  log(`  3. Monitor performance and adjust RAG_TOP_K in .env`, 'blue');
}

// Run pipeline
main().catch(error => {
  log(`\n❌ Pipeline failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
