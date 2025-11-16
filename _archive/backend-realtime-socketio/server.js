/**
 * Cura AI Real-Time WebSocket Server
 * Handles voice/video streaming, ASR, LLM, emergency detection
 */

import { WebSocketServer } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { config } from './src/config.js';
import { logger } from './src/logger.js';
import { SessionManager } from './src/services/sessionManager.js';
import { AudioProcessor } from './src/services/audioProcessor.js';
import { VideoProcessor } from './src/services/videoProcessor.js';
import { LLMService } from './src/services/llmService.js';
import { EmergencyDetector } from './src/services/emergencyDetector.js';
import { createConnectionHandler } from './src/handlers/connectionHandler.js';

// Initialize services
const sessionManager = new SessionManager();
const audioProcessor = new AudioProcessor();
const videoProcessor = new VideoProcessor();
const llmService = new LLMService();
const emergencyDetector = new EmergencyDetector();

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  verifyClient: (info, callback) => {
    // Verify JWT token from query params
    const url = new URL(info.req.url, 'ws://localhost');
    const token = url.searchParams.get('token');
    
    if (!token) {
      callback(false, 401, 'Missing token');
      return;
    }
    
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      info.req.sessionId = decoded.sessionId;
      callback(true);
    } catch (err) {
      logger.warn('Invalid token', { error: err.message });
      callback(false, 401, 'Invalid token');
    }
  }
});

// Connection tracking
const connections = new Map();

wss.on('connection', (ws, req) => {
  const sessionId = req.sessionId;
  const connectionId = `${sessionId}_${Date.now()}`;
  
  logger.info('WebSocket connected', { sessionId, connectionId });
  
  // Create connection context
  const context = {
    sessionId,
    connectionId,
    ws,
    audioBuffer: Buffer.alloc(0),
    audioSeq: 0,
    videoSeq: 0,
    emergencyState: 'LISTENING',
    transcriptions: []
  };
  
  connections.set(connectionId, context);
  
  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    sessionId,
    connectionId,
    timestamp: Date.now()
  }));
  
  // Set up message handler
  const handleMessage = createConnectionHandler(
    context,
    sessionManager,
    audioProcessor,
    videoProcessor,
    llmService,
    emergencyDetector
  );
  
  ws.on('message', async (data) => {
    try {
      await handleMessage(data);
    } catch (error) {
      logger.error('Message handling error', { 
        error: error.message,
        sessionId,
        stack: error.stack 
      });
      
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Internal server error',
        timestamp: Date.now()
      }));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    logger.info('WebSocket disconnected', { sessionId, connectionId });
    connections.delete(connectionId);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    logger.error('WebSocket error', { 
      error: error.message,
      sessionId,
      connectionId 
    });
  });
  
  // Heartbeat
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server');
  wss.close(() => {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
});

// Start server
const PORT = config.PORT || 8080;
server.listen(PORT, () => {
  logger.info(`🚀 Cura AI Real-Time Server running on port ${PORT}`);
  logger.info(`WebSocket endpoint: ws://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export { wss, connections };
