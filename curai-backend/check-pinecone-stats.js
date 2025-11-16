#!/usr/bin/env node

import 'dotenv/config';
import axios from 'axios';

const PINECONE_CTRL_URL = 'https://api.pinecone.io';

async function checkStats() {
  try {
    // Get index host
    const listResp = await axios.get(`${PINECONE_CTRL_URL}/indexes`, {
      headers: { 'Api-Key': process.env.PINECONE_API_KEY }
    });
    
    const indexes = listResp.data?.indexes || listResp.data || [];
    const index = indexes.find(i => i.name === process.env.PINECONE_INDEX_NAME);
    
    if (!index) {
      console.error(`❌ Index "${process.env.PINECONE_INDEX_NAME}" not found`);
      process.exit(1);
    }
    
    const host = index.host;
    
    // Get stats
    const statsResp = await axios.post(
      `https://${host}/describe_index_stats`,
      {},
      {
        headers: {
          'Api-Key': process.env.PINECONE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const stats = statsResp.data;
    const vectorCount = stats.totalRecordCount || stats.total_vector_count || 0;
    
    console.log('\n📊 Pinecone Index Stats:\n');
    console.log(`  Index: ${process.env.PINECONE_INDEX_NAME}`);
    console.log(`  Total Vectors: ${vectorCount.toLocaleString()}`);
    console.log(`  Dimension: ${stats.dimension}`);
    console.log(`  Namespaces: ${stats.namespaces ? Object.keys(stats.namespaces).length : 0}`);
    
    // Storage estimates
    const vectorSize = 1536 * 4; // 1536 dims * 4 bytes per float32
    const metadataSize = 1300; // avg metadata bytes with truncation
    const totalBytes = vectorCount * (vectorSize + metadataSize);
    const totalGB = totalBytes / (1024**3);
    
    console.log(`\n💾 Estimated Storage:\n`);
    console.log(`  Vector data: ${((vectorCount * vectorSize) / (1024**3)).toFixed(3)} GB`);
    console.log(`  Metadata: ${((vectorCount * metadataSize) / (1024**3)).toFixed(3)} GB`);
    console.log(`  Total: ~${totalGB.toFixed(3)} GB`);
    console.log(`  Free tier remaining: ~${(2 - totalGB).toFixed(3)} GB`);
    
    // Progress to cap
    const cap = 260000;
    const progress = (vectorCount / cap * 100).toFixed(1);
    console.log(`\n📈 Progress to Cap:\n`);
    console.log(`  Current: ${vectorCount.toLocaleString()} / ${cap.toLocaleString()} (${progress}%)`);
    console.log(`  Remaining: ${(cap - vectorCount).toLocaleString()} vectors`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

checkStats();
