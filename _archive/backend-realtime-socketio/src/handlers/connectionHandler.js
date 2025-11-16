/**
 * Connection Handler
 * Routes WebSocket messages to appropriate handlers
 */

import { logger } from '../logger.js';

export function createConnectionHandler(
  context,
  sessionManager,
  audioProcessor,
  videoProcessor,
  llmService,
  emergencyDetector
) {
  return async function handleMessage(data) {
    let message;
    
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      logger.warn('Invalid message format', { error: error.message });
      return;
    }
    
    const { type, chatId, ...payload } = message;
    const { ws, sessionId } = context;
    
    logger.debug('Message received', { type, sessionId, chatId });
    
    try {
      switch (type) {
        case 'audio_chunk':
          await handleAudioChunk(context, payload, sessionManager, audioProcessor, llmService, emergencyDetector);
          break;
        
        case 'video_frame':
          await handleVideoFrame(context, payload, videoProcessor);
          break;
        
        case 'text_message':
          await handleTextMessage(context, payload, sessionManager, llmService, emergencyDetector);
          break;
        
        case 'control':
          await handleControl(context, payload);
          break;
        
        case 'heartbeat':
          ws.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
          break;
        
        default:
          logger.warn('Unknown message type', { type, sessionId });
      }
    } catch (error) {
      logger.error('Handler error', { 
        type,
        sessionId,
        error: error.message,
        stack: error.stack 
      });
      
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Processing failed',
        timestamp: Date.now()
      }));
    }
  };
}

/**
 * Handle audio chunk
 */
async function handleAudioChunk(context, payload, sessionManager, audioProcessor, llmService, emergencyDetector) {
  const { ws, sessionId } = context;
  const { seq, audio_format, payload: audioBase64 } = payload;
  
  context.audioSeq = seq || context.audioSeq + 1;
  
  // Process audio chunk
  const transcription = await audioProcessor.processChunk(context, audioBase64);
  
  if (transcription) {
    // Send transcription to client
    ws.send(JSON.stringify({
      type: 'transcription',
      text: transcription,
      interim: false,
      seq: context.audioSeq,
      timestamp: Date.now()
    }));
    
    // Add to transcription history
    context.transcriptions.push(transcription);
    
    // Process as text message
    await handleTextMessage(
      context,
      { text: transcription, source: 'voice' },
      sessionManager,
      llmService,
      emergencyDetector
    );
  }
}

/**
 * Handle video frame
 */
async function handleVideoFrame(context, payload, videoProcessor) {
  const { ws } = context;
  const { ts, payload: frameBase64 } = payload;
  
  const result = await videoProcessor.processFrame(context, frameBase64);
  
  // Acknowledge receipt
  ws.send(JSON.stringify({
    type: 'video_received',
    timestamp: ts || Date.now(),
    analysis: result.analysis
  }));
}

/**
 * Handle text message
 */
async function handleTextMessage(context, payload, sessionManager, llmService, emergencyDetector) {
  const { ws, sessionId } = context;
  const { text, source = 'text' } = payload;
  
  if (!text || text.trim().length === 0) {
    return;
  }
  
  // Detect emergency
  const emergencyState = emergencyDetector.transitionState(context, text);
  
  // Send emergency state update if needed
  if (emergencyState.requiresCall) {
    ws.send(JSON.stringify({
      type: 'emergency_state_update',
      state: emergencyState.state,
      emergencyType: emergencyState.emergencyType,
      urgency: emergencyState.urgency,
      keywords: emergencyState.keywords,
      timestamp: Date.now()
    }));
  }
  
  // Save user message
  await sessionManager.addMessage(sessionId, 'user', text, { 
    source,
    emergencyState: emergencyState.state 
  });
  
  // Get conversation history
  const messages = await sessionManager.getMessages(sessionId, 10);
  const llmMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  
  // Add current message
  llmMessages.push({ role: 'user', content: text });
  
  // Stream LLM response
  let fullResponse = '';
  
  try {
    for await (const chunk of llmService.streamCompletion(llmMessages)) {
      if (chunk.startsWith('[ERROR]')) {
        ws.send(JSON.stringify({
          type: 'error',
          message: chunk,
          timestamp: Date.now()
        }));
        break;
      }
      
      fullResponse += chunk;
      
      // Send intermediate response
      ws.send(JSON.stringify({
        type: 'intermediate_response',
        chunk,
        timestamp: Date.now()
      }));
    }
    
    // Send final response
    ws.send(JSON.stringify({
      type: 'final_response',
      text: fullResponse,
      emergencyState: emergencyState.state,
      timestamp: Date.now()
    }));
    
    // Save assistant message
    await sessionManager.addMessage(sessionId, 'assistant', fullResponse, {
      emergencyState: emergencyState.state,
      emergencyType: emergencyState.emergencyType
    });
    
  } catch (error) {
    logger.error('LLM streaming failed', { sessionId, error: error.message });
    
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to generate response',
      timestamp: Date.now()
    }));
  }
}

/**
 * Handle control messages
 */
async function handleControl(context, payload) {
  const { ws } = context;
  const { action } = payload;
  
  logger.info('Control action', { 
    sessionId: context.sessionId,
    action,
    payload 
  });
  
  switch (action) {
    case 'start_realtime':
      ws.send(JSON.stringify({
        type: 'control_ack',
        action: 'start_realtime',
        status: 'ready',
        timestamp: Date.now()
      }));
      break;
    
    case 'stop_realtime':
      // Force transcribe any remaining audio
      if (context.audioBuffer.length > 0) {
        // Handle remaining audio
      }
      
      ws.send(JSON.stringify({
        type: 'control_ack',
        action: 'stop_realtime',
        status: 'stopped',
        timestamp: Date.now()
      }));
      break;
    
    default:
      logger.warn('Unknown control action', { action });
  }
}

export default createConnectionHandler;
