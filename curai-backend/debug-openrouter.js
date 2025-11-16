#!/usr/bin/env node

/**
 * Debug OpenRouter Request - Compare working curl vs axios
 */

import 'dotenv/config';
import axios from 'axios';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const API_KEY = process.env.OPENROUTER_API_KEY;

console.log('\n=== Testing OpenRouter with axios ===\n');

async function testWithAxios() {
  try {
    console.log('Making request with axios...');
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: 'Reply OK' }],
        max_tokens: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Cura AI Test'
        },
        timeout: 20000
      }
    );
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Failed');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('\nRequest config:');
    console.log('  URL:', error.config?.url);
    console.log('  Headers:', JSON.stringify(error.config?.headers, null, 2));
    console.log('  Data:', error.config?.data);
    return false;
  }
}

testWithAxios();
