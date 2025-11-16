# Frontend Integration Guide

How to connect your frontend (Next.js, React, HTML) to the Cura AI backend.

---

## Base Configuration

```typescript
// config.ts
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000",
  endpoints: {
    health: "/api/health",
    search: "/api/search",
    embed: "/api/embed/batch",
    realtimeStart: "/api/realtime/start",
    realtimeStop: "/api/realtime/stop",
    realtimeWs: "/ws/realtime"
  }
};
```

---

## REST API Integration

### Health Check

```typescript
// lib/api.ts
export async function checkHealth() {
  const response = await fetch(`${API_CONFIG.baseUrl}/api/health`);
  const data = await response.json();
  return data;
}
```

### RAG Search Query

```typescript
export interface SearchRequest {
  query: string;
  sessionId?: string;
  topK?: number;
}

export interface SearchResponse {
  success: boolean;
  sessionId: string;
  query: string;
  sources: Array<{
    id: string;
    score: number;
    text: string;
    metadata: Record<string, any>;
  }>;
  response: string;
  emergency: boolean;
  model: string;
  timestamp: string;
}

export async function searchMedical(request: SearchRequest): Promise<SearchResponse> {
  const response = await fetch(`${API_CONFIG.baseUrl}/api/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return await response.json();
}
```

### React Hook Example

```typescript
// hooks/useSearch.ts
import { useState } from "react";
import { searchMedical, SearchResponse } from "@/lib/api";

export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);
  
  const search = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchMedical({ query });
      setResult(response);
      
      // Handle emergency
      if (response.emergency) {
        // Show emergency UI
        console.warn("EMERGENCY DETECTED:", response);
      }
      
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { search, loading, error, result };
}
```

### Component Usage

```typescript
// components/SearchBox.tsx
"use client";

import { useState } from "react";
import { useSearch } from "@/hooks/useSearch";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const { search, loading, error, result } = useSearch();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await search(query);
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a medical question..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      
      {error && (
        <div className="error">{error}</div>
      )}
      
      {result && (
        <div>
          {result.emergency && (
            <div className="emergency-banner">
              🚨 EMERGENCY DETECTED - CALL 911 IMMEDIATELY
            </div>
          )}
          
          <div className="response">
            <h3>Response:</h3>
            <p>{result.response}</p>
          </div>
          
          <div className="sources">
            <h4>Sources:</h4>
            {result.sources.map(source => (
              <div key={source.id}>
                <strong>Score: {source.score.toFixed(2)}</strong>
                <p>{source.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## WebSocket Integration

### TypeScript WebSocket Client

```typescript
// lib/websocket.ts
export type WSMessage = 
  | { type: "connected"; sessionId: string; message: string }
  | { type: "transcript"; text: string; partial?: boolean; final?: boolean }
  | { type: "llm_token"; content: string }
  | { type: "llm_complete" }
  | { type: "audio_chunk_ack"; bufferDuration: number }
  | { type: "control_ack"; action: string; message: string }
  | { type: "finalized"; finalTranscript: string; messageCount: number }
  | { type: "error"; message: string }
  | { type: "pong" };

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private onMessage?: (message: WSMessage) => void;
  private onError?: (error: Error) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(sessionId?: string) {
    this.sessionId = sessionId || `session-${Date.now()}`;
  }
  
  connect(callbacks: {
    onMessage?: (message: WSMessage) => void;
    onError?: (error: Error) => void;
    onOpen?: () => void;
    onClose?: () => void;
  }) {
    const wsUrl = `${API_CONFIG.wsUrl}${API_CONFIG.endpoints.realtimeWs}?sessionId=${this.sessionId}`;
    
    this.ws = new WebSocket(wsUrl);
    this.onMessage = callbacks.onMessage;
    this.onError = callbacks.onError;
    
    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
      callbacks.onOpen?.();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.onMessage?.(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.onError?.(new Error("WebSocket connection error"));
    };
    
    this.ws.onclose = () => {
      console.log("WebSocket closed");
      callbacks.onClose?.();
      
      // Auto-reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(callbacks), 2000 * this.reconnectAttempts);
      }
    };
  }
  
  sendAudioChunk(base64Audio: string, format: string = "webm") {
    this.send({
      type: "audio_chunk",
      data: base64Audio,
      format
    });
  }
  
  sendText(text: string) {
    this.send({
      type: "text_message",
      text
    });
  }
  
  sendControl(action: "start" | "stop" | "reset") {
    this.send({
      type: "control",
      action
    });
  }
  
  finalize() {
    this.send({ type: "finalize" });
  }
  
  ping() {
    this.send({ type: "ping" });
  }
  
  private send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not open, cannot send:", data);
    }
  }
  
  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
```

### React Hook for WebSocket

```typescript
// hooks/useRealtime.ts
import { useEffect, useRef, useState } from "react";
import { RealtimeClient, WSMessage } from "@/lib/websocket";

export function useRealtime(sessionId?: string) {
  const [connected, setConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);
  
  useEffect(() => {
    const client = new RealtimeClient(sessionId);
    clientRef.current = client;
    
    client.connect({
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onMessage: (message: WSMessage) => {
        switch (message.type) {
          case "connected":
            console.log("Session ID:", message.sessionId);
            break;
          
          case "transcript":
            setTranscript(prev => message.partial ? message.text : prev + " " + message.text);
            break;
          
          case "llm_token":
            setLlmResponse(prev => prev + message.content);
            break;
          
          case "llm_complete":
            console.log("LLM response complete");
            break;
          
          case "error":
            setError(message.message);
            break;
        }
      },
      onError: (err) => setError(err.message)
    });
    
    return () => {
      client.disconnect();
    };
  }, [sessionId]);
  
  const sendText = (text: string) => {
    setLlmResponse(""); // Reset for new response
    clientRef.current?.sendText(text);
  };
  
  const sendAudio = (base64Audio: string, format: string = "webm") => {
    clientRef.current?.sendAudioChunk(base64Audio, format);
  };
  
  const startRecording = () => {
    clientRef.current?.sendControl("start");
  };
  
  const stopRecording = () => {
    clientRef.current?.sendControl("stop");
  };
  
  return {
    connected,
    transcript,
    llmResponse,
    error,
    sendText,
    sendAudio,
    startRecording,
    stopRecording
  };
}
```

### Component with Audio Recording

```typescript
// components/RealtimeChat.tsx
"use client";

import { useRealtime } from "@/hooks/useRealtime";
import { useRef, useState } from "react";

export function RealtimeChat() {
  const { connected, transcript, llmResponse, sendText, sendAudio, startRecording, stopRecording } = useRealtime();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const base64 = await blobToBase64(event.data);
          sendAudio(base64, "webm");
        }
      };
      
      mediaRecorder.start(1000); // Send chunks every 1 second
      setRecording(true);
      startRecording();
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };
  
  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    setRecording(false);
    stopRecording();
  };
  
  const handleTextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get("message") as string;
    if (text.trim()) {
      sendText(text);
      e.currentTarget.reset();
    }
  };
  
  return (
    <div>
      <div className="status">
        Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}
      </div>
      
      <div className="transcript">
        <h3>Transcript:</h3>
        <p>{transcript || "No transcript yet..."}</p>
      </div>
      
      <div className="response">
        <h3>AI Response:</h3>
        <p>{llmResponse || "Waiting for response..."}</p>
      </div>
      
      <div className="controls">
        <button
          onClick={recording ? handleStopRecording : handleStartRecording}
          disabled={!connected}
        >
          {recording ? "🔴 Stop Recording" : "🎤 Start Recording"}
        </button>
      </div>
      
      <form onSubmit={handleTextSubmit}>
        <input
          name="message"
          type="text"
          placeholder="Or type a message..."
          disabled={!connected}
        />
        <button type="submit" disabled={!connected}>
          Send
        </button>
      </form>
    </div>
  );
}

// Helper function
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

---

## Error Handling

```typescript
// lib/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new APIError(
      error.message || `HTTP ${response.status}`,
      response.status,
      error
    );
  }
  
  return await response.json();
}

// Usage
export async function searchMedical(request: SearchRequest): Promise<SearchResponse> {
  const response = await fetch(`${API_CONFIG.baseUrl}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  
  return await handleAPIResponse<SearchResponse>(response);
}
```

---

## Next.js App Router Example

```typescript
// app/api/search/route.ts (Server-side proxy)
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const response = await fetch("http://localhost:3000/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

```typescript
// app/search/page.tsx (Client component)
"use client";

import { SearchBox } from "@/components/SearchBox";

export default function SearchPage() {
  return (
    <div>
      <h1>Medical Search</h1>
      <SearchBox />
    </div>
  );
}
```

---

## Testing

```typescript
// __tests__/api.test.ts
import { searchMedical } from "@/lib/api";

describe("API Integration", () => {
  it("should return search results", async () => {
    const result = await searchMedical({
      query: "What are the steps for CPR?"
    });
    
    expect(result.success).toBe(true);
    expect(result.response).toBeTruthy();
    expect(result.sources.length).toBeGreaterThan(0);
  });
  
  it("should detect emergencies", async () => {
    const result = await searchMedical({
      query: "Someone is not breathing!"
    });
    
    expect(result.emergency).toBe(true);
    expect(result.response).toContain("911");
  });
});
```

---

## Environment Variables (.env.local)

```bash
# Next.js Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Production
# NEXT_PUBLIC_API_URL=https://api.curai.com
# NEXT_PUBLIC_WS_URL=wss://api.curai.com
```

---

## Complete Example: Chat Component

See `/examples/ChatComponent.tsx` in the repository for a complete, production-ready chat interface with:
- Real-time streaming
- Audio recording
- Emergency detection
- Source citations
- Error handling
- Loading states

---

**Questions?** Check the main `README.md` or open an issue on GitHub.
