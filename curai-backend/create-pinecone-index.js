#!/usr/bin/env node

/**
 * Create Pinecone Index - Automated Setup Script
 * Creates the 'default' index with proper configuration for text-embedding-3-small
 */

import 'dotenv/config';
import axios from 'axios';

const PINECONE_CTRL_URL = 'https://api.pinecone.io';

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

async function createPineconeIndex() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('  Pinecone Index Creation', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  const indexName = process.env.PINECONE_INDEX_NAME || 'default';
  const dimension = parseInt(process.env.EMBEDDING_DIMENSION) || 1536;
  const environment = process.env.PINECONE_ENVIRONMENT || 'us-east-1-aws';
  
  log(`\nTarget Configuration:`, 'cyan');
  log(`  Index Name: ${indexName}`, 'blue');
  log(`  Dimension: ${dimension}`, 'blue');
  log(`  Metric: cosine`, 'blue');
  log(`  Environment: ${environment}`, 'blue');
  
  try {
    // Check if index already exists
    log('\n📋 Checking existing indexes...', 'cyan');
    const listResp = await axios.get(`${PINECONE_CTRL_URL}/indexes`, {
      headers: { 'Api-Key': process.env.PINECONE_API_KEY },
      timeout: 10000
    });
    
    const indexes = listResp.data?.indexes || listResp.data || [];
    const existing = indexes.find(i => i.name === indexName);
    
    if (existing) {
      log(`✅ Index "${indexName}" already exists!`, 'green');
      const host = existing.host || existing.hosts?.controller || existing?.spec?.host;
      log(`   Host: ${host}`, 'blue');
      log(`   Dimension: ${existing.dimension || 'N/A'}`, 'blue');
      log(`   Status: ${existing.status?.state || existing.status || 'unknown'}`, 'blue');
      
      if (existing.dimension && existing.dimension !== dimension) {
        log(`\n⚠️  Warning: Existing index has dimension ${existing.dimension}, but EMBEDDING_DIMENSION is set to ${dimension}`, 'yellow');
        log(`   You may need to either:`, 'yellow');
        log(`   - Delete the index and recreate it with dimension ${dimension}, or`, 'yellow');
        log(`   - Update EMBEDDING_DIMENSION in .env to ${existing.dimension}`, 'yellow');
      }
      
      return true;
    }
    
    // Create new index
    log(`\n🔨 Creating index "${indexName}"...`, 'cyan');
    
    // Determine cloud and region from environment
    const [region, cloud] = environment.split('-').length > 2 
      ? [environment.split('-').slice(0, 3).join('-'), environment.split('-').slice(3).join('-')]
      : ['us-east-1', 'aws'];
    
    const createPayload = {
      name: indexName,
      dimension: dimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: cloud || 'aws',
          region: region || 'us-east-1'
        }
      }
    };
    
    log(`   Payload: ${JSON.stringify(createPayload, null, 2)}`, 'blue');
    
    const createResp = await axios.post(
      `${PINECONE_CTRL_URL}/indexes`,
      createPayload,
      {
        headers: {
          'Api-Key': process.env.PINECONE_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    log(`\n✅ Index "${indexName}" created successfully!`, 'green');
    log(`   Status: Initializing (this may take 1-2 minutes)`, 'blue');
    
    // Wait for index to be ready
    log(`\n⏳ Waiting for index to be ready...`, 'cyan');
    let ready = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!ready && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
      
      try {
        const checkResp = await axios.get(`${PINECONE_CTRL_URL}/indexes/${indexName}`, {
          headers: { 'Api-Key': process.env.PINECONE_API_KEY },
          timeout: 10000
        });
        
        const status = checkResp.data?.status?.state || checkResp.data?.status;
        log(`   Attempt ${attempts}/${maxAttempts}: ${status}`, 'blue');
        
        if (status === 'Ready' || status === 'ready') {
          ready = true;
          log(`\n🎉 Index is ready!`, 'green');
          
          const host = checkResp.data?.host || checkResp.data?.hosts?.controller;
          if (host) {
            log(`   Host: ${host}`, 'blue');
          }
        }
      } catch (e) {
        log(`   Attempt ${attempts}/${maxAttempts}: Checking...`, 'yellow');
      }
    }
    
    if (!ready) {
      log(`\n⚠️  Index creation initiated but not yet ready after ${attempts * 5}s`, 'yellow');
      log(`   The index is still initializing. You can proceed, but operations may fail until it's ready.`, 'yellow');
      log(`   Check status at: https://app.pinecone.io/`, 'blue');
    }
    
    return true;
    
  } catch (error) {
    log(`\n❌ Failed to create index`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'yellow');
      log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow');
      
      if (error.response.status === 409) {
        log(`\n💡 Index may already exist. Run the test script to verify.`, 'blue');
      }
    } else {
      log(`   Error: ${error.message}`, 'yellow');
    }
    return false;
  }
}

// Run
createPineconeIndex()
  .then(success => {
    if (success) {
      log('\n✅ Setup complete! Run "node test-apis.js" to verify connectivity.', 'green');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
