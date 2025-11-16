#!/usr/bin/env node
import 'dotenv/config';

console.log('Environment Check:');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY?.substring(0, 20) + '...');
console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY?.substring(0, 20) + '...');
console.log('PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME);
console.log('OPENROUTER_EMBED_MODEL:', process.env.OPENROUTER_EMBED_MODEL);
