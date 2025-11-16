/**
 * Corpus Embedding and Indexing Script
 * 
 * Usage:
 *   node src/scripts/embed-corpus.js <data-folder>
 *   node src/scripts/embed-corpus.js src/scripts/sample-data
 * 
 * Reads text files from folder, generates embeddings, and uploads to Pinecone
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { batchEmbedAndUpsert } from "../services/pinecone.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Process text files in a folder and upload to Pinecone
 */
async function embedFolder(folderPath) {
  console.log(`\n📂 Reading files from: ${folderPath}`);
  
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Folder does not exist: ${folderPath}`);
  }
  
  // Read all .txt files
  const files = fs.readdirSync(folderPath)
    .filter(f => f.endsWith(".txt") || f.endsWith(".md"));
  
  if (files.length === 0) {
    console.log("⚠️  No .txt or .md files found in folder");
    return;
  }
  
  console.log(`📄 Found ${files.length} files to process`);
  
  // Read file contents
  const items = files.map(filename => {
    const filePath = path.join(folderPath, filename);
    const text = fs.readFileSync(filePath, "utf8");
    const id = path.basename(filename, path.extname(filename));
    
    return {
      id,
      text: text.trim(),
      metadata: {
        filename,
        source: "corpus-upload",
        uploadedAt: new Date().toISOString()
      }
    };
  });
  
  console.log(`\n📊 Processing ${items.length} documents`);
  console.log(`⚙️  Batch size: ${process.env.EMBED_BATCH_SIZE || 50}`);
  
  // Process in batches
  const batchSize = parseInt(process.env.EMBED_BATCH_SIZE || "50", 10);
  const totalBatches = Math.ceil(items.length / batchSize);
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    
    console.log(`\n🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} items)`);
    
    try {
      const result = await batchEmbedAndUpsert(batch);
      console.log(`✅ Batch ${batchNum} uploaded successfully`);
      console.log(`   Upserted count: ${result.upsertedCount || "N/A"}`);
    } catch (error) {
      console.error(`❌ Batch ${batchNum} failed:`, error.message);
      
      if (process.env.CONTINUE_ON_ERROR !== "true") {
        throw error;
      }
    }
    
    // Rate limiting: wait between batches
    if (i + batchSize < items.length) {
      const delayMs = parseInt(process.env.BATCH_DELAY_MS || "1000", 10);
      console.log(`⏳ Waiting ${delayMs}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`\n✨ Embedding complete! ${items.length} documents processed`);
}

/**
 * Chunk large documents into smaller pieces
 */
function chunkDocument(text, maxChunkSize = 1000, overlap = 100) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    const chunk = text.substring(start, end);
    chunks.push(chunk);
    start += maxChunkSize - overlap;
  }
  
  return chunks;
}

/**
 * Process large documents with chunking
 */
async function embedFolderWithChunking(folderPath, chunkSize = 1000) {
  console.log(`\n📂 Reading files from: ${folderPath}`);
  console.log(`📏 Chunking documents at ${chunkSize} characters`);
  
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Folder does not exist: ${folderPath}`);
  }
  
  const files = fs.readdirSync(folderPath)
    .filter(f => f.endsWith(".txt") || f.endsWith(".md"));
  
  if (files.length === 0) {
    console.log("⚠️  No .txt or .md files found in folder");
    return;
  }
  
  console.log(`📄 Found ${files.length} files to process`);
  
  const allChunks = [];
  
  // Read and chunk each file
  for (const filename of files) {
    const filePath = path.join(folderPath, filename);
    const text = fs.readFileSync(filePath, "utf8").trim();
    const baseId = path.basename(filename, path.extname(filename));
    
    const chunks = chunkDocument(text, chunkSize);
    
    console.log(`📄 ${filename}: ${chunks.length} chunks`);
    
    chunks.forEach((chunk, idx) => {
      allChunks.push({
        id: `${baseId}_chunk_${idx}`,
        text: chunk,
        metadata: {
          filename,
          chunkIndex: idx,
          totalChunks: chunks.length,
          source: "corpus-upload-chunked",
          uploadedAt: new Date().toISOString()
        }
      });
    });
  }
  
  console.log(`\n📊 Total chunks to upload: ${allChunks.length}`);
  
  // Upload in batches
  const batchSize = parseInt(process.env.EMBED_BATCH_SIZE || "50", 10);
  const totalBatches = Math.ceil(allChunks.length / batchSize);
  
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    
    console.log(`\n🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)`);
    
    try {
      const result = await batchEmbedAndUpsert(batch);
      console.log(`✅ Batch ${batchNum} uploaded successfully`);
    } catch (error) {
      console.error(`❌ Batch ${batchNum} failed:`, error.message);
      
      if (process.env.CONTINUE_ON_ERROR !== "true") {
        throw error;
      }
    }
    
    if (i + batchSize < allChunks.length) {
      const delayMs = parseInt(process.env.BATCH_DELAY_MS || "1000", 10);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`\n✨ Embedding complete! ${allChunks.length} chunks from ${files.length} documents processed`);
}

// Main execution
const args = process.argv.slice(2);
const folderPath = args[0] || path.join(__dirname, "sample-data");
const useChunking = args.includes("--chunk");
const chunkSize = parseInt(args.find(arg => arg.startsWith("--chunk-size="))?.split("=")[1] || "1000", 10);

console.log(`
╔══════════════════════════════════════════════════════╗
║       Cura AI Corpus Embedding & Indexing            ║
╠══════════════════════════════════════════════════════╣
║  Folder: ${folderPath.padEnd(45)}║
║  Chunking: ${(useChunking ? "Yes" : "No").padEnd(42)}║
║  Chunk Size: ${chunkSize.toString().padEnd(38)}║
╚══════════════════════════════════════════════════════╝
`);

// Validate environment
if (!process.env.PINECONE_API_KEY) {
  console.error("❌ PINECONE_API_KEY not configured in .env");
  process.exit(1);
}

if (!process.env.OPENROUTER_API_KEY && process.env.MOCK_MODE !== "true") {
  console.error("❌ OPENROUTER_API_KEY not configured in .env");
  console.error("   Set MOCK_MODE=true for testing without API keys");
  process.exit(1);
}

// Run
(useChunking 
  ? embedFolderWithChunking(folderPath, chunkSize) 
  : embedFolder(folderPath)
).catch(error => {
  console.error("\n❌ Embedding failed:", error.message);
  console.error(error.stack);
  process.exit(1);
});
