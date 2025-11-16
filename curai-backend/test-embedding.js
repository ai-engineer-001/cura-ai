#!/usr/bin/env node

/**
 * Quick Test - Embed a small sample to verify pipeline
 */

import 'dotenv/config';
import axios from 'axios';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const PINECONE_CTRL_URL = 'https://api.pinecone.io';

console.log('\n=== Quick Embedding Test ===\n');

// Test data
const testData = [
  { id: 'test1', question: 'What is diabetes?', answer: 'Diabetes is a chronic disease that occurs when the pancreas does not produce enough insulin.' },
  { id: 'test2', question: 'What causes high blood pressure?', answer: 'High blood pressure can be caused by genetics, poor diet, lack of exercise, and stress.' }
];

async function testPipeline() {
  try {
    // 1. Check environment
    console.log('1. Environment Check:');
    console.log(`   OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY?.substring(0, 20)}...`);
    console.log(`   PINECONE_API_KEY: ${process.env.PINECONE_API_KEY?.substring(0, 20)}...`);
    console.log(`   PINECONE_INDEX_NAME: ${process.env.PINECONE_INDEX_NAME}`);
    
    // 2. Generate embeddings
    console.log('\n2. Generating embeddings...');
    const texts = testData.map(d => `Question: ${d.question}\n\nAnswer: ${d.answer}`);
    
    const embeddingResp = await axios.post(
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
          'X-Title': 'Cura AI Test'
        },
        timeout: 30000
      }
    );
    
    const embeddings = embeddingResp.data.data.map(item => item.embedding);
    console.log(`   ✅ Generated ${embeddings.length} embeddings (dim: ${embeddings[0].length})`);
    
    // 3. Get Pinecone host
    console.log('\n3. Resolving Pinecone host...');
    const listResp = await axios.get(`${PINECONE_CTRL_URL}/indexes`, {
      headers: { 'Api-Key': process.env.PINECONE_API_KEY },
      timeout: 10000
    });
    
    const indexes = listResp.data?.indexes || listResp.data || [];
    const index = indexes.find(i => i.name === process.env.PINECONE_INDEX_NAME);
    
    if (!index) {
      throw new Error(`Index "${process.env.PINECONE_INDEX_NAME}" not found`);
    }
    
    const host = index.host || index.hosts?.controller;
    console.log(`   ✅ Host: ${host}`);
    
    // 4. Upload to Pinecone
    console.log('\n4. Uploading to Pinecone...');
    const vectors = testData.map((record, idx) => ({
      id: `test_${record.id}`,
      values: embeddings[idx],
      metadata: {
        dataset: 'test',
        question: record.question,
        answer: record.answer,
        source: 'quick-test'
      }
    }));
    
    await axios.post(
      `https://${host}/vectors/upsert`,
      { vectors },
      {
        headers: {
          'Api-Key': process.env.PINECONE_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log(`   ✅ Uploaded ${vectors.length} vectors`);
    
    // 5. Verify
    console.log('\n5. Verifying index stats...');
    const statsResp = await axios.post(
      `https://${host}/describe_index_stats`,
      {},
      {
        headers: {
          'Api-Key': process.env.PINECONE_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const stats = statsResp.data;
    console.log(`   ✅ Total vectors: ${stats.totalRecordCount || stats.total_vector_count || 0}`);
    console.log(`   ✅ Dimension: ${stats.dimension}`);
    
    console.log('\n🎉 Test passed! Pipeline is working correctly.\n');
    console.log('Ready to run full embedding: npm run embed:datasets\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testPipeline();
