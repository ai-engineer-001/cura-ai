// quick node ws client to test realtime endpoint
const WebSocket = require("ws");
const token = "token_demo"; // will be replaced with the actual token printed by server demo login
const chatId = "demo-chat";
const url = `ws://localhost:4000/realtime?chatId=${chatId}&token=${token}`;
const ws = new WebSocket(url);

ws.on("open", () => {
  console.log("WS open");
  ws.send(JSON.stringify({ type: "control", action: "start_realtime" }));
  // send a mock audio chunk
  setTimeout(() => {
    ws.send(JSON.stringify({ type: "audio_chunk", seq: 1, audio_format: "webm-opus", payload: "<base64>" }));
  }, 500);
});

ws.on("message", (m) => {
  console.log("recv:", m.toString());
});
