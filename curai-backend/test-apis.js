#!/usr/bin/env node

/**
 * Test Script - Verify OpenRouter and Pinecone API Connectivity
 * Tests both APIs independently before starting the full server
 */

import 'dotenv/config';
import axios from 'axios';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const PINECONE_CTRL_URL = 'https://api.pinecone.io'; // Management API to resolve index host

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Utility: build OpenRouter headers
function orHeaders(variant = 'site') {
  const base = {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json'
  };
  if (variant === 'site') {
    return {
      ...base,
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
      'X-Title': 'Cura AI Connectivity Test'
    };
  }
  if (variant === 'openrouter') {
    return {
      ...base,
      'HTTP-Referer': 'https://openrouter.ai',
      'X-Title': 'Cura AI Connectivity Test'
    };
  }
  if (variant === 'minimal') {
    return base;
  }
  return base;
}

// Test 1A: OpenRouter models listing (sanity for key validity)
async function testOpenRouterModels() {
  log('\n📚 Listing OpenRouter models...', 'cyan');
  try {
    let lastErr;
    for (const hv of ['site', 'openrouter', 'minimal']) {
      try {
        const res = await axios.get(`${OPENROUTER_BASE_URL}/models`, {
          headers: orHeaders(hv),
          timeout: 15000
        });
        const models = res.data?.data || res.data?.models || [];
        log(`✅ Models endpoint reachable (headers: ${hv})`, 'green');
        log(`   Models available: ${models.length}`, 'blue');
        return true;
      } catch (e) {
        lastErr = e;
        const status = e.response?.status;
        const msg = e.response?.data?.error?.message || JSON.stringify(e.response?.data) || e.message;
        log(`   ↪ Models failed with headers ${hv} (${status || 'no-status'}): ${msg}`, 'yellow');
      }
    }
    throw lastErr || new Error('Models request failed for all header variants');
  } catch (error) {
    log(`❌ Models endpoint failed`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'yellow');
      log(`   Error: ${error.response.data?.error?.message || JSON.stringify(error.response.data)}`, 'yellow');
    } else {
      log(`   Error: ${error.message}`, 'yellow');
    }
    return false;
  }
}

// Test 1B: Try multiple free models for chat
async function testOpenRouterChat() {
  log('\n🔑 Testing OpenRouter chat/completions...', 'cyan');
  const candidates = [
    process.env.OPENROUTER_DEFAULT_MODEL,
    process.env.OPENROUTER_FALLBACK_MODEL,
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-7b-instruct:free',
  ].filter(Boolean);

  for (const model of candidates) {
    try {
      let lastErr;
      for (const hv of ['site', 'openrouter', 'minimal']) {
        try {
          const response = await axios.post(
            `${OPENROUTER_BASE_URL}/chat/completions`,
            {
              model,
              messages: [{ role: 'user', content: 'Reply with OK only.' }],
              max_tokens: 5
            },
            { headers: orHeaders(hv), timeout: 20000 }
          );
          const reply = response.data.choices?.[0]?.message?.content?.trim();
          log(`✅ Chat working on model: ${model} (headers: ${hv})`, 'green');
          log(`   Response: "${reply}"`, 'blue');
          return true;
        } catch (e) {
          lastErr = e;
          const status = e.response?.status;
          const msg = e.response?.data?.error?.message || JSON.stringify(e.response?.data) || e.message;
          log(`   ↪ Failed on ${model} with headers ${hv} (${status || 'no-status'}): ${msg}`, 'yellow');
        }
      }
      throw lastErr || new Error(`Chat failed on ${model} for all header variants`);
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.error?.message || JSON.stringify(error.response?.data) || error.message;
      log(`   ↪ Failed on ${model} (${status || 'no-status'}): ${msg}`, 'yellow');
      // continue trying next model
    }
  }
  log('❌ All candidate chat models failed', 'red');
  return false;
}

// Test 2: OpenRouter embedding
async function testEmbeddingModel() {
  log('\n🧮 Testing OpenRouter embeddings...', 'cyan');
  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/embeddings`,
      {
        model: process.env.OPENROUTER_EMBED_MODEL,
        input: 'Test embedding generation'
      },
      { headers: orHeaders(), timeout: 20000 }
    );
    const embedding = response.data.data?.[0]?.embedding || [];
    log(`✅ Embedding API working`, 'green');
    log(`   Model: ${process.env.OPENROUTER_EMBED_MODEL}`, 'blue');
    log(`   Dimension: ${embedding.length}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Embedding API failed`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'yellow');
      log(`   Error: ${error.response.data?.error?.message || JSON.stringify(error.response.data)}`, 'yellow');
    } else {
      log(`   Error: ${error.message}`, 'yellow');
    }
    return false;
  }
}

// Test 3: Pinecone API - resolve index host then describe stats
async function testPineconeConnection() {
  log('\n📍 Testing Pinecone connection...', 'cyan');
  try {
    // List indexes to find the host for the configured index name
    const list = await axios.get(`${PINECONE_CTRL_URL}/indexes`, {
      headers: { 'Api-Key': process.env.PINECONE_API_KEY },
      timeout: 10000
    });

    const indexes = list.data?.indexes || list.data || [];
    const idx = indexes.find(i => (i.name === process.env.PINECONE_INDEX_NAME));
    if (!idx) {
      log(`❌ Index "${process.env.PINECONE_INDEX_NAME}" not found for this API key`, 'red');
      const names = indexes.map(i => i.name).join(', ') || 'none';
      log(`   Available indexes: ${names}`, 'yellow');
      return false;
    }

    const host = idx.host || idx.hosts?.controller || idx?.spec?.host;
    if (!host) {
      log('❌ Could not resolve index host from Pinecone controller response', 'red');
      log(`   Index object: ${JSON.stringify(idx)}`, 'yellow');
      return false;
    }

    const base = `https://${host}`;
    const statsResp = await axios.post(
      `${base}/describe_index_stats`,
      {},
      {
        headers: { 'Api-Key': process.env.PINECONE_API_KEY, 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );
    const stats = statsResp.data;
    log(`✅ Pinecone index reachable`, 'green');
    log(`   Host: ${host}`, 'blue');
    log(`   Total Vectors: ${stats.totalRecordCount || stats.total_vector_count || 0}`, 'blue');
    log(`   Dimension: ${stats.dimension || 'N/A'}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Pinecone test failed`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'yellow');
      log(`   Error: ${error.response.data?.message || JSON.stringify(error.response.data)}`, 'yellow');
    } else {
      log(`   Error: ${error.message}`, 'yellow');
    }
    return false;
  }
}

// (Embedding test moved above as Test 2)

// Main Test Runner
async function runAllTests() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('  Cura AI Backend - API Connectivity Test', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  // Check if API keys are set
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === '') {
    log('\n❌ OPENROUTER_API_KEY not set in .env file', 'red');
    process.exit(1);
  }
  
  if (!process.env.PINECONE_API_KEY || process.env.PINECONE_API_KEY === '') {
    log('\n❌ PINECONE_API_KEY not set in .env file', 'red');
    process.exit(1);
  }
  
  const results = {
    openrouterModels: false,
    openrouterChat: false,
    pinecone: false,
    embedding: false
  };
  
  // Run tests sequentially
  results.openrouterModels = await testOpenRouterModels();
  results.openrouterChat = await testOpenRouterChat();
  // Embeddings can be tested independently as well
  results.embedding = await testEmbeddingModel();
  
  results.pinecone = await testPineconeConnection();
  
  // Summary
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  Test Summary', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  log(`\n${passed}/${total} tests passed\n`, passed === total ? 'green' : 'yellow');
  
  Object.entries(results).forEach(([test, result]) => {
    const icon = result ? '✅' : '❌';
    const color = result ? 'green' : 'red';
    log(`${icon} ${test}`, color);
  });
  
  if (passed === total) {
    log('\n🎉 All APIs are working! You can now start the server with: npm run dev', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above and fix your .env configuration.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
