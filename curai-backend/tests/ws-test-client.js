/**
 * WebSocket Test Client
 * Tests real-time audio/text streaming via WebSocket
 * 
 * Usage: node tests/ws-test-client.js
 */

import WebSocket from "ws";

const WS_URL = "ws://localhost:3000/ws/realtime?sessionId=test-client-session";

console.log(`
╔══════════════════════════════════════════════════════╗
║       Cura AI WebSocket Test Client                  ║
╠══════════════════════════════════════════════════════╣
║  Connecting to: ${WS_URL}
╚══════════════════════════════════════════════════════╝
`);

const ws = new WebSocket(WS_URL);

ws.on("open", () => {
  console.log("✅ WebSocket connection established\n");
  
  // Test 1: Send text message
  console.log("📤 Test 1: Sending text message...");
  ws.send(JSON.stringify({
    type: "text_message",
    text: "What should I do if someone is choking?"
  }));
  
  // Test 2: Send control message after 5 seconds
  setTimeout(() => {
    console.log("\n📤 Test 2: Sending control message (start recording)...");
    ws.send(JSON.stringify({
      type: "control",
      action: "start"
    }));
  }, 5000);
  
  // Test 3: Send mock audio chunk after 7 seconds
  setTimeout(() => {
    console.log("\n📤 Test 3: Sending mock audio chunk...");
    // This is a mock base64 audio chunk - in production, this would be real audio
    const mockAudio = Buffer.from("mock audio data").toString("base64");
    ws.send(JSON.stringify({
      type: "audio_chunk",
      data: mockAudio,
      format: "webm"
    }));
  }, 7000);
  
  // Test 4: Stop recording after 9 seconds
  setTimeout(() => {
    console.log("\n📤 Test 4: Sending control message (stop recording)...");
    ws.send(JSON.stringify({
      type: "control",
      action: "stop"
    }));
  }, 9000);
  
  // Test 5: Finalize session after 11 seconds
  setTimeout(() => {
    console.log("\n📤 Test 5: Finalizing session...");
    ws.send(JSON.stringify({
      type: "finalize"
    }));
  }, 11000);
  
  // Close connection after 13 seconds
  setTimeout(() => {
    console.log("\n👋 Closing connection...");
    ws.close();
  }, 13000);
});

ws.on("message", (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    switch (message.type) {
      case "connected":
        console.log("🔗 Connected:", message.message);
        console.log("   Session ID:", message.sessionId);
        break;
      
      case "transcript":
        console.log("📝 Transcript:", message.text);
        if (message.partial) {
          console.log("   (partial)");
        }
        if (message.final) {
          console.log("   (final)");
        }
        break;
      
      case "llm_token":
        process.stdout.write(message.content);
        break;
      
      case "llm_complete":
        console.log("\n✅ LLM response complete");
        break;
      
      case "audio_chunk_ack":
        console.log("✅ Audio chunk acknowledged");
        console.log("   Buffer duration:", message.bufferDuration, "ms");
        break;
      
      case "control_ack":
        console.log("✅ Control acknowledged:", message.action);
        console.log("  ", message.message);
        break;
      
      case "finalized":
        console.log("✅ Session finalized");
        console.log("   Final transcript:", message.finalTranscript);
        console.log("   Message count:", message.messageCount);
        console.log("   Duration:", message.duration, "ms");
        break;
      
      case "error":
        console.error("❌ Error:", message.message);
        break;
      
      case "pong":
        console.log("🏓 Pong received");
        break;
      
      default:
        console.log("📨 Unknown message type:", message.type);
        console.log("   Data:", message);
    }
  } catch (error) {
    console.error("❌ Failed to parse message:", error.message);
    console.log("   Raw data:", data.toString());
  }
});

ws.on("close", () => {
  console.log("\n🔌 WebSocket connection closed");
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║            WebSocket Test Complete                   ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  process.exit(0);
});

ws.on("error", (error) => {
  console.error("\n❌ WebSocket error:", error.message);
  process.exit(1);
});

// Send ping every 30 seconds to keep connection alive
const pingInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log("\n🏓 Sending ping...");
    ws.send(JSON.stringify({ type: "ping" }));
  }
}, 30000);

// Clear interval on close
ws.on("close", () => clearInterval(pingInterval));
