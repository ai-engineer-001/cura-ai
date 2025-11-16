import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import healthRoutes from "./routes/health.js";
import embedRoutes from "./routes/embed.js";
import searchRoutes from "./routes/search.js";
import realtimeRoutes from "./routes/realtime.js";

// Import WebSocket handler
import { setupWebsocket } from "./ws/ws-server.js";

// Import middleware
import { emergencyMiddleware } from "./middleware/emergency-detect.js";

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname"
      }
    }
  }
});

// Register CORS with dynamic origin support
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3001', 'http://127.0.0.1:3001'];

await server.register(cors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list for production
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
});

// Register multipart for file uploads
await server.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for audio files
  }
});

// Register WebSocket support
await server.register(websocket);

// Register routes
await server.register(healthRoutes, { prefix: "/api/health" });
await server.register(embedRoutes, { prefix: "/api/embed" });
await server.register(searchRoutes, { prefix: "/api/search" });
await server.register(realtimeRoutes, { prefix: "/api/realtime" });

// Add root-level health check for convenience
server.get("/health", async (request, reply) => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  };
});

// Register WebSocket routes
setupWebsocket(server);

// Emergency detection middleware for search endpoints
server.addHook("preHandler", async (req, reply) => {
  if (req.url.startsWith("/api/search") && req.method === "POST") {
    const emergencyDetected = emergencyMiddleware(req);
    if (emergencyDetected) {
      server.log.warn({ emergency: emergencyDetected }, "Emergency detected in query");
      req.emergency = emergencyDetected;
    }
  }
});

// Global error handler
server.setErrorHandler((error, request, reply) => {
  server.log.error(error);
  
  if (error.statusCode === 413) {
    reply.status(413).send({ 
      error: "Payload too large", 
      message: "Audio file exceeds 10MB limit" 
    });
    return;
  }
  
  reply.status(error.statusCode || 500).send({
    error: error.name || "Internal Server Error",
    message: error.message || "An unexpected error occurred"
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  server.log.info(`Received ${signal}, shutting down gracefully...`);
  await server.close();
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000", 10);
    const host = process.env.HOST || "0.0.0.0";
    
    await server.listen({ port, host });
    
    server.log.info(`
╔═══════════════════════════════════════════════════════╗
║         Cura AI Backend Server - READY                ║
╠═══════════════════════════════════════════════════════╣
║  HTTP:      http://localhost:${port}                   ║
║  WebSocket: ws://localhost:${port}/ws/realtime        ║
╠═══════════════════════════════════════════════════════╣
║  Endpoints:                                           ║
║    GET  /api/health                                   ║
║    POST /api/embed/batch                              ║
║    POST /api/search                                   ║
║    POST /api/realtime/start                           ║
║    POST /api/realtime/stop                            ║
║    WS   /ws/realtime                                  ║
╚═══════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

export default server;
