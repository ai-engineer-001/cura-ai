// Quick test to verify OpenRouter API key works
import 'dotenv/config';
import axios from 'axios';

const apiKey = process.env.OPENROUTER_API_KEY;

console.log('='.repeat(60));
console.log('OpenRouter API Key Test');
console.log('='.repeat(60));
console.log(`Key length: ${apiKey?.length || 0}`);
console.log(`Key prefix: ${apiKey?.substring(0, 15)}...`);
console.log(`Key suffix: ...${apiKey?.substring(apiKey.length - 10)}`);
console.log('='.repeat(60));

async function testOpenRouter() {
  try {
    console.log('\n🔍 Testing OpenRouter API...\n');
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'user', content: 'Say "test successful" if you can read this.' }
        ],
        max_tokens: 20
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Cura AI Test',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ SUCCESS! OpenRouter API is working');
    console.log('Response:', response.data.choices[0].message.content);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('❌ FAILED! OpenRouter API error\n');
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.log('No response received from server');
    } else {
      console.log(`Error: ${error.message}`);
    }
    
    console.log('='.repeat(60));
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if OPENROUTER_API_KEY is set correctly in .env');
    console.log('2. Verify the key at: https://openrouter.ai/keys');
    console.log('3. Make sure the key hasn\'t expired or been revoked');
    console.log('4. Try generating a new key');
    console.log('='.repeat(60));
  }
}

testOpenRouter();
