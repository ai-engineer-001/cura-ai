import { transcribeChunk, StreamingASR } from "../services/asr.js";
import { forwardToOpenRouterStreaming } from "../services/openrouter.js";
import { synthesizeSpeech } from "../services/tts.js";

/**
 * Setup WebSocket server for real-time audio/text streaming
 * Path: /ws/realtime
 */
export function setupWebsocket(fastify) {
  // Track active sessions
  const sessions = new Map();
  
  fastify.get("/ws/realtime", { websocket: true }, (connection, request) => {
    const sessionId = request.query.sessionId || `ws-${Date.now()}`;
    
    fastify.log.info({ sessionId }, "WebSocket connection established");
    
    // Create streaming ASR instance for this session
    const streamingASR = new StreamingASR();
    
    // Store session data
    sessions.set(sessionId, {
      connection,
      streamingASR,
      startedAt: Date.now(),
      messageCount: 0
    });
    
    // Send welcome message
    connection.send(JSON.stringify({
      type: "connected",
      sessionId,
      message: "WebSocket connection established",
      timestamp: new Date().toISOString()
    }));
    
    /**
     * Handle incoming messages
     * Message types:
     * - audio_chunk: { type: "audio_chunk", data: "<base64>", format: "webm" }
     * - text_message: { type: "text_message", text: "..." }
     * - control: { type: "control", action: "start" | "stop" | "reset" }
     * - finalize: { type: "finalize" } - End session and get final response
     */
    connection.on("message", async (rawData) => {
      try {
        const message = JSON.parse(rawData.toString());
        const session = sessions.get(sessionId);
        
        if (!session) {
          connection.send(JSON.stringify({
            type: "error",
            message: "Session not found"
          }));
          return;
        }
        
        session.messageCount++;
        
        fastify.log.debug({ 
          sessionId, 
          messageType: message.type 
        }, "WebSocket message received");
        
        // Handle different message types
        switch (message.type) {
          case "audio_chunk":
            await handleAudioChunk(connection, session, message);
            break;
          
          case "text_message":
            await handleTextMessage(connection, session, message);
            break;
          
          case "control":
            await handleControl(connection, session, message);
            break;
          
          case "finalize":
            await handleFinalize(connection, session);
            break;
          
          case "ping":
            connection.send(JSON.stringify({ type: "pong" }));
            break;
          
          default:
            connection.send(JSON.stringify({
              type: "error",
              message: `Unknown message type: ${message.type}`
            }));
        }
      } catch (error) {
        fastify.log.error({ error, sessionId }, "WebSocket message error");
        
        connection.send(JSON.stringify({
          type: "error",
          message: error.message || "Failed to process message"
        }));
      }
    });
    
    /**
     * Handle connection close
     */
    connection.on("close", () => {
      fastify.log.info({ sessionId }, "WebSocket connection closed");
      sessions.delete(sessionId);
    });
    
    /**
     * Handle connection error
     */
    connection.on("error", (error) => {
      fastify.log.error({ error, sessionId }, "WebSocket connection error");
      sessions.delete(sessionId);
    });
  });
  
  fastify.log.info("WebSocket server ready at /ws/realtime");
  
  // Cleanup old sessions periodically
  setInterval(() => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [sessionId, session] of sessions.entries()) {
      if (now - session.startedAt > maxAge) {
        fastify.log.info({ sessionId }, "Cleaning up stale WebSocket session");
        try {
          session.connection.close();
        } catch (error) {
          // Ignore close errors
        }
        sessions.delete(sessionId);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}

/**
 * Handle audio chunk from client
 */
async function handleAudioChunk(connection, session, message) {
  const { data, format = "webm" } = message;
  
  if (!data) {
    connection.send(JSON.stringify({
      type: "error",
      message: "audio_chunk requires 'data' field with base64 audio"
    }));
    return;
  }
  
  // Add chunk to streaming ASR buffer
  session.streamingASR.addChunk(data);
  
  // Check if buffer is ready for transcription
  if (session.streamingASR.shouldTranscribe()) {
    try {
      const text = await session.streamingASR.transcribe();
      
      if (text && text.trim().length > 0) {
        // Send partial transcript
        connection.send(JSON.stringify({
          type: "transcript",
          text,
          partial: true
        }));
        
        // Optionally: Stream LLM response for real-time feedback
        // await forwardToOpenRouterStreaming({ 
        //   prompt: text, 
        //   socket: connection 
        // });
      }
    } catch (error) {
      console.error("Transcription error:", error);
      connection.send(JSON.stringify({
        type: "error",
        message: `Transcription failed: ${error.message}`
      }));
    }
  }
  
  // Acknowledge receipt
  connection.send(JSON.stringify({
    type: "audio_chunk_ack",
    bufferDuration: session.streamingASR.bufferDuration
  }));
}

/**
 * Handle text message from client
 */
async function handleTextMessage(connection, session, message) {
  const { text } = message;
  
  if (!text || text.trim().length === 0) {
    connection.send(JSON.stringify({
      type: "error",
      message: "text_message requires non-empty 'text' field"
    }));
    return;
  }
  
  // Forward text to OpenRouter for streaming response
  try {
    await forwardToOpenRouterStreaming({ 
      prompt: text, 
      socket: connection 
    });
  } catch (error) {
    connection.send(JSON.stringify({
      type: "error",
      message: `LLM streaming failed: ${error.message}`
    }));
  }
}

/**
 * Handle control messages
 */
async function handleControl(connection, session, message) {
  const { action } = message;
  
  switch (action) {
    case "start":
      connection.send(JSON.stringify({
        type: "control_ack",
        action: "start",
        message: "Recording started"
      }));
      break;
    
    case "stop":
      // Transcribe any remaining buffered audio
      if (session.streamingASR.buffer.length > 0) {
        try {
          const text = await session.streamingASR.transcribe();
          if (text && text.trim().length > 0) {
            connection.send(JSON.stringify({
              type: "transcript",
              text,
              partial: false,
              final: true
            }));
          }
        } catch (error) {
          console.error("Final transcription error:", error);
        }
      }
      
      connection.send(JSON.stringify({
        type: "control_ack",
        action: "stop",
        message: "Recording stopped"
      }));
      break;
    
    case "reset":
      session.streamingASR.buffer = [];
      session.streamingASR.bufferDuration = 0;
      
      connection.send(JSON.stringify({
        type: "control_ack",
        action: "reset",
        message: "Session reset"
      }));
      break;
    
    default:
      connection.send(JSON.stringify({
        type: "error",
        message: `Unknown control action: ${action}`
      }));
  }
}

/**
 * Handle session finalization
 */
async function handleFinalize(connection, session) {
  // Transcribe any remaining audio
  let finalText = "";
  
  if (session.streamingASR.buffer.length > 0) {
    try {
      finalText = await session.streamingASR.transcribe();
    } catch (error) {
      console.error("Final transcription error:", error);
    }
  }
  
  connection.send(JSON.stringify({
    type: "finalized",
    finalTranscript: finalText,
    messageCount: session.messageCount,
    duration: Date.now() - session.startedAt
  }));
}
