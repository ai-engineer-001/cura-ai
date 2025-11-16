/**
 * Configuration loader
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

export const config = {
  // Server
  PORT: parseInt(process.env.PORT) || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret',
  
  // OpenRouter (Primary LLM)
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
  
  // OpenAI (Whisper ASR + TTS)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  WHISPER_MODEL: process.env.WHISPER_MODEL || 'whisper-1',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Audio Processing
  AUDIO_CHUNK_SIZE_MS: parseInt(process.env.AUDIO_CHUNK_SIZE_MS) || 250,
  AUDIO_FORMAT: process.env.AUDIO_FORMAT || 'webm-opus',
  MAX_AUDIO_BUFFER_SIZE: parseInt(process.env.MAX_AUDIO_BUFFER_SIZE) || 5000000,
  
  // Video Processing
  VIDEO_ENABLED: process.env.VIDEO_ENABLED === 'true',
  VIDEO_FRAME_INTERVAL_MS: parseInt(process.env.VIDEO_FRAME_INTERVAL_MS) || 1500,
  VIDEO_WIDTH: parseInt(process.env.VIDEO_WIDTH) || 320,
  VIDEO_HEIGHT: parseInt(process.env.VIDEO_HEIGHT) || 240,
  
  // Emergency Detection
  EMERGENCY_KEYWORDS: (process.env.EMERGENCY_KEYWORDS || 
    'help,can\'t breathe,not breathing,unconscious,chest pain,bleeding,choking,seizure,collapsed'
  ).split(',').map(k => k.trim().toLowerCase()),
  
  URGENCY_THRESHOLD: parseInt(process.env.URGENCY_THRESHOLD) || 5,
  
  // Rate Limiting
  MAX_CONNECTIONS_PER_IP: parseInt(process.env.MAX_CONNECTIONS_PER_IP) || 5,
  MAX_MESSAGES_PER_MINUTE: parseInt(process.env.MAX_MESSAGES_PER_MINUTE) || 60,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'json',
  
  // System Prompt
  SYSTEM_PROMPT: `You are Cura AI — a first-aid emergency assistant. 

CRITICAL RULES:
- You NEVER diagnose medical conditions
- You ONLY provide verified first-aid instructions
- You ALWAYS recommend calling emergency services (911/108/112) for serious symptoms
- Use short sentences, one action per line
- Speak calmly and reassuringly
- Prioritize life-saving steps: Airway → Breathing → Circulation

For EVERY response:
- Start with immediate action if needed
- Provide bulleted, step-by-step guidance
- Include "Call emergency services immediately" for critical situations
- Keep replies under 100 words

You are NOT a replacement for medical professionals. You guide until help arrives.`
};

// Validate required config
const requiredKeys = ['OPENROUTER_API_KEY', 'OPENAI_API_KEY', 'JWT_SECRET'];
for (const key of requiredKeys) {
  if (!config[key] || config[key] === 'your_key_here' || config[key] === 'change_this_secret') {
    console.error(`❌ Missing or invalid config: ${key}`);
    console.error(`Please set ${key} in your .env file`);
    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export default config;
