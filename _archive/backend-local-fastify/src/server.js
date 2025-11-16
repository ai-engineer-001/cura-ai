import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from "axios";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const MODE = process.env.MODE || "mock";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-8b-instruct:free";

// Simple in-memory stores
const users = new Map();
const chats = new Map();

// Helpers
function nowTs() { return Math.floor(Date.now() / 1000); }
function makeUser(name = "demo") {
  const id = randomUUID();
  const token = `token_${id}`;
  const user = { id, name, token, created_at: new Date().toISOString(), settings: { realtime_enabled: true } };
  users.set(id, user);
  users.set(token, user);
  return user;
}

const demoUser = makeUser("Demo User");

// OpenRouter streaming helper
async function streamOpenRouterCompletion(messages, socket) {
  if (MODE === "mock" || !OPENROUTER_API_KEY) {
    const tokens = ["Mock response:", " This is a test reply."];
    for (const token of tokens) {
      socket.send(JSON.stringify({ type: "assistant_token", token }));
      await new Promise(r => setTimeout(r, 100));
    }
    socket.send(JSON.stringify({ type: "assistant_final", text: tokens.join("") }));
    return;
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: OPENROUTER_MODEL,
        messages,
        stream: true,
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:4000",
          "X-Title": "Cura AI Local Backend",
        },
        responseType: "stream",
      }
    );

    let fullText = "";
    response.data.on("data", (chunk) => {
      const lines = chunk.toString().split("\n").filter(line => line.trim().startsWith("data:"));
      for (const line of lines) {
        const data = line.replace(/^data: /, "").trim();
        if (data === "[DONE]") {
          socket.send(JSON.stringify({ type: "assistant_final", text: fullText }));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content || "";
          if (token) {
            fullText += token;
            socket.send(JSON.stringify({ type: "assistant_token", token }));
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    response.data.on("end", () => {
      socket.send(JSON.stringify({ type: "assistant_final", text: fullText }));
    });

    response.data.on("error", (err) => {
      socket.send(JSON.stringify({ type: "error", error: "streaming_failed" }));
    });
  } catch (error) {
    socket.send(JSON.stringify({ type: "error", error: error.message || "llm_error" }));
  }
}

async function startServer() {
  const server = Fastify({ logger: true });
  
  await server.register(cors, { origin: true });
  await server.register(websocket);

  // Auth middleware
  server.decorateRequest("user", null);
  server.addHook("preHandler", async (req, reply) => {
    const anonPaths = ["/", "/health", "/v1/demo/login"];
    if (anonPaths.includes(req.routerPath || "")) return;
    
    const auth = req.headers["authorization"];
    if (!auth) {
      reply.code(401).send({ error: "Missing Authorization header" });
      return;
    }
    
    const parts = auth.split(" ");
    const token = parts.length === 2 ? parts[1] : parts[0];
    const u = users.get(token);
    if (!u) {
      reply.code(401).send({ error: "Invalid token" });
      return;
    }
    req.user = u;
  });

  // Routes
  server.get("/", async () => ({ 
    hello: "Cura AI backend", 
    mode: MODE,
    openrouter: OPENROUTER_API_KEY ? "configured" : "missing"
  }));
  
  server.get("/health", async () => ({ status: "ok", ts: new Date().toISOString() }));

  server.get("/v1/demo/login", async () => {
    return { user: demoUser, token: demoUser.token };
  });

  server.get("/v1/users/me", async (req) => {
    return req.user;
  });

  server.put("/v1/users/me", async (req) => {
    const body = req.body;
    const u = req.user;
    if (body.name) u.name = body.name;
    if (body.settings) u.settings = { ...u.settings, ...body.settings };
    users.set(u.id, u);
    return u;
  });

  server.get("/v1/chats", async (req) => {
    const u = req.user;
    const list = Array.from(chats.values()).filter((c) => c.userId === u.id);
    return { chats: list };
  });

  server.post("/v1/chats", async (req) => {
    const u = req.user;
    const body = req.body;
    const id = randomUUID();
    const chat = { 
      id, 
      userId: u.id, 
      title: body?.title || "New chat", 
      created_at: new Date().toISOString(), 
      messages: [] 
    };
    chats.set(id, chat);
    return { chatId: id, chat };
  });

  server.get("/v1/chats/:chatId", async (req, reply) => {
    const u = req.user;
    const { chatId } = req.params;
    const chat = chats.get(chatId);
    if (!chat || chat.userId !== u.id) return reply.code(404).send({ error: "Not found" });
    return chat;
  });

  server.post("/v1/chats/:chatId/messages", async (req, reply) => {
    const u = req.user;
    const { chatId } = req.params;
    const body = req.body;
    const chat = chats.get(chatId);
    if (!chat || chat.userId !== u.id) return reply.code(404).send({ error: "Not found" });
    
    const userMsg = { id: randomUUID(), role: "user", text: body.text, ts: nowTs() };
    chat.messages.push(userMsg);
    
    const assistant = {
      id: randomUUID(),
      role: "assistant",
      text: `Mock assistant reply to: "${body.text}"`,
      meta: { confidence: 0.9 },
      ts: nowTs()
    };
    chat.messages.push(assistant);
    return assistant;
  });

  server.post("/v1/chats/:chatId/handoff", async (req, reply) => {
    const u = req.user;
    const { chatId } = req.params;
    const body = req.body;
    const chat = chats.get(chatId);
    if (!chat || chat.userId !== u.id) return reply.code(404).send({ error: "Not found" });
    
    chat.emergency = { at: new Date().toISOString(), payload: body };
    return { success: true, note: "Emergency handoff recorded" };
  });

  server.post("/v1/uploads/presign", async (req) => {
    const key = `mock/${randomUUID()}`;
    return { uploadUrl: `http://localhost:4000/mock-upload/${key}`, key, expiresIn: 3600 };
  });

  server.post("/v1/transcriptions", async (req) => {
    const body = req.body;
    const t = body.text || "This is a mocked transcription result.";
    return { transcriptionId: randomUUID(), text: t, final: true };
  });

  server.post("/v1/admin/rag/update", async (req, reply) => {
    const key = req.headers["x-admin-key"];
    if (!key || key !== "admin-local-key") return reply.code(403).send({ error: "Forbidden" });
    return { success: true, updatedAt: new Date().toISOString() };
  });

  // WebSocket realtime
  server.get("/realtime", { websocket: true }, (connection, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token") || "";
    const chatId = url.searchParams.get("chatId") || "";
    const user = users.get(token);
    
    const conversationHistory = [];

    connection.socket.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        
        if (data.type === "control") {
          if (data.action === "start_realtime") {
            connection.socket.send(JSON.stringify({ 
              type: "ack", 
              message: "realtime_started" 
            }));
          } else if (data.action === "stop_realtime") {
            connection.socket.send(JSON.stringify({ 
              type: "ack", 
              message: "realtime_stopped" 
            }));
          }
        } else if (data.type === "audio_chunk") {
          // Mock ASR transcription
          const transcription = "Patient needs emergency assistance";
          connection.socket.send(JSON.stringify({ 
            type: "transcription", 
            interim: false, 
            text: transcription 
          }));
          
          conversationHistory.push({ role: "user", content: transcription });
          await streamOpenRouterCompletion(conversationHistory, connection.socket);
        } else if (data.type === "text_message") {
          conversationHistory.push({ role: "user", content: data.text });
          await streamOpenRouterCompletion(conversationHistory, connection.socket);
        } else {
          connection.socket.send(JSON.stringify({ type: "error", error: "unknown_type" }));
        }
      } catch (err) {
        connection.socket.send(JSON.stringify({ type: "error", error: "invalid_json" }));
      }
    });
  });

  server.put("/mock-upload/:key", async (req, reply) => {
    const { key } = req.params;
    const filePath = path.join(__dirname, "../tmp", key.replace("/", "_"));
    const chunks = [];
    for await (const chunk of req.raw) {
      chunks.push(Buffer.from(chunk));
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.concat(chunks));
    return { success: true, path: filePath };
  });

  const PORT = parseInt(process.env.PORT || "4000", 10);
  await server.listen({ port: PORT, host: "0.0.0.0" });
  
  server.log.info(`✅ Server listening on http://localhost:${PORT}`);
  server.log.info(`🔐 Demo login: GET http://localhost:${PORT}/v1/demo/login`);
  server.log.info(`🔑 OpenRouter: ${OPENROUTER_API_KEY ? 'Configured' : 'MISSING - Set in .env'}`);
  server.log.info(`🤖 Model: ${OPENROUTER_MODEL}`);
  server.log.info(`⚙️  Mode: ${MODE}`);
}

startServer().catch(console.error);
