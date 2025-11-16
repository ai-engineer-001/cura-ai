/**
 * Audio Processor
 * Handles audio chunks, buffering, and Whisper ASR
 */

import OpenAI from 'openai';
import FormData from 'form-data';
import fs from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { logger } from '../logger.js';

export class AudioProcessor {
  constructor() {
    this.openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  
  /**
   * Append audio chunk to buffer
   */
  appendChunk(context, audioBase64) {
    try {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      context.audioBuffer = Buffer.concat([context.audioBuffer, audioBuffer]);
      
      logger.debug('Audio chunk appended', {
        sessionId: context.sessionId,
        chunkSize: audioBuffer.length,
        totalSize: context.audioBuffer.length
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to append audio chunk', { error: error.message });
      return false;
    }
  }
  
  /**
   * Check if buffer is ready for transcription
   */
  isBufferReady(context, minSizeBytes = 100000) {
    return context.audioBuffer.length >= minSizeBytes;
  }
  
  /**
   * Transcribe accumulated audio buffer
   */
  async transcribeBuffer(context, language = null) {
    if (context.audioBuffer.length === 0) {
      return null;
    }
    
    try {
      // Write buffer to temp file
      const tempFilePath = join(tmpdir(), `audio_${uuidv4()}.webm`);
      fs.writeFileSync(tempFilePath, context.audioBuffer);
      
      logger.info('Transcribing audio', {
        sessionId: context.sessionId,
        bufferSize: context.audioBuffer.length,
        tempFile: tempFilePath
      });
      
      // Call Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: config.WHISPER_MODEL,
        language: language || undefined,
        response_format: 'text'
      });
      
      // Clean up
      fs.unlinkSync(tempFilePath);
      
      // Clear buffer after successful transcription
      context.audioBuffer = Buffer.alloc(0);
      
      logger.info('Transcription completed', {
        sessionId: context.sessionId,
        text: transcription.substring(0, 100)
      });
      
      return transcription;
      
    } catch (error) {
      logger.error('Transcription failed', { 
        sessionId: context.sessionId,
        error: error.message 
      });
      
      // Clear buffer on error to prevent infinite retry
      context.audioBuffer = Buffer.alloc(0);
      return null;
    }
  }
  
  /**
   * Process audio chunk (buffer + transcribe when ready)
   */
  async processChunk(context, audioBase64, forceTranscribe = false) {
    this.appendChunk(context, audioBase64);
    
    if (forceTranscribe || this.isBufferReady(context)) {
      return await this.transcribeBuffer(context);
    }
    
    return null;
  }
}

export default AudioProcessor;
