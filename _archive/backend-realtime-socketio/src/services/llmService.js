/**
 * LLM Service
 * Handles OpenRouter streaming completions
 */

import axios from 'axios';
import { config } from '../config.js';
import { logger } from '../logger.js';

export class LLMService {
  constructor() {
    this.baseURL = config.OPENROUTER_BASE_URL;
    this.apiKey = config.OPENROUTER_API_KEY;
    this.model = config.OPENROUTER_MODEL;
  }
  
  /**
   * Stream chat completion from OpenRouter
   */
  async *streamCompletion(messages, onChunk = null) {
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: config.SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: true
    };
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://curaai.health',
      'X-Title': 'Cura AI Emergency Assistant'
    };
    
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        payload,
        { 
          headers,
          responseType: 'stream'
        }
      );
      
      let fullResponse = '';
      
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              logger.info('LLM stream completed', { 
                responseLength: fullResponse.length 
              });
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullResponse += content;
                
                if (onChunk) {
                  onChunk(content);
                }
                
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      }
      
      return fullResponse;
      
    } catch (error) {
      logger.error('LLM streaming failed', { 
        error: error.message,
        response: error.response?.data 
      });
      
      yield '[ERROR] Unable to generate response. Please try again.';
    }
  }
  
  /**
   * Generate complete response (non-streaming)
   */
  async generateResponse(messages) {
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: config.SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: false
    };
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://curaai.health',
      'X-Title': 'Cura AI Emergency Assistant'
    };
    
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        payload,
        { headers }
      );
      
      return response.data.choices[0].message.content;
      
    } catch (error) {
      logger.error('LLM generation failed', { 
        error: error.message,
        response: error.response?.data 
      });
      
      return 'Unable to generate response. Please call emergency services if this is an emergency.';
    }
  }
  
  /**
   * Build emergency response template
   */
  buildEmergencyResponse(emergencyType) {
    const responses = {
      cardiac: `🚨 CALL 911/108/112 IMMEDIATELY

1. Lay person flat on back
2. Begin CPR if trained:
   • 30 chest compressions (2 inches deep)
   • 2 rescue breaths
   • Repeat until help arrives
3. Use AED if available

Stay calm. Help is coming.`,
      
      breathing: `🚨 CALL 911/108/112 NOW

1. Sit person upright - DO NOT lay flat
2. Loosen tight clothing
3. Keep person calm
4. Help use inhaler if available
5. Monitor breathing

Help is on the way.`,
      
      bleeding: `🚨 CALL 911/108/112 IMMEDIATELY

1. Apply DIRECT pressure with clean cloth
2. Keep pressure CONSTANT - don't peek
3. Add more cloth if soaked
4. Elevate injured area above heart
5. DO NOT remove cloth

Keep pressure until help arrives.`,
      
      unconscious: `🚨 CALL 911/108/112 NOW

1. Check breathing - watch chest
2. If breathing: Place on side (recovery position)
3. If NOT breathing: Start CPR if trained
4. DO NOT give food/drink
5. Stay with them

Help is coming.`
    };
    
    return responses[emergencyType] || responses.unconscious;
  }
}

export default LLMService;
