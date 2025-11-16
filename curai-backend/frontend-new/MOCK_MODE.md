# 🎭 Cura AI - Mock Mode Documentation

## Overview
The Cura AI Frontend now runs in **MOCK MODE** by default. This means all features work without requiring a backend server!

## ✅ What Works in Mock Mode

### 1. **Text Chat** ✓
- Send messages and receive simulated streaming responses
- Chat history saved locally
- Multiple chat sessions
- Create/delete chats

**How it works:**
- User messages are captured normally
- Mock responses are generated and streamed word-by-word
- No backend API calls required

### 2. **Realtime Voice Mode** ✓
- Enable microphone and capture audio
- See live waveform visualization
- Receive simulated transcriptions
- Get mock AI responses

**How it works:**
- Microphone is actually accessed and audio is captured
- Audio chunks are logged to console (not sent anywhere)
- After 2 seconds: Mock transcription appears
- After 5 seconds: Mock AI response is added to chat
- After 8 seconds: Emergency detection simulation begins

### 3. **Video Streaming** ✓
- Enable camera and see preview
- Recording indicator works
- Video frames are captured

**How it works:**
- Camera is actually accessed
- Video preview displays in real-time
- Frames are extracted but logged to console (not sent)

### 4. **Emergency Alert System** ✓
- Automatic emergency state detection
- Visual alerts with guidance
- State progression simulation

**How it works:**
- Simulated sequence:
  1. DETECTING_URGENCY (after 8s in realtime mode)
  2. GUIDING (after 11s)
  3. Can progress to SUGGEST_CALL or CALL_NOW
- Emergency call button (108/112) works

### 5. **Settings & Preferences** ✓
- Dark/Light mode toggle
- Audio/Video device selection
- Subtitle preferences
- All settings persist in localStorage

**How it works:**
- All settings saved to browser storage
- Theme changes apply immediately
- Device enumeration uses real MediaDevices API

---

## 🚀 Getting Started

### Quick Start
```bash
# Install dependencies
npm install --legacy-peer-deps

# Run in dev mode
npm run dev

# Open http://localhost:3000
```

**That's it!** No backend required, no environment variables needed.

---

## 🧪 Testing Features

### Test Text Chat
1. Navigate to `/chat/[any-id]` or click "New Chat"
2. Type a message: "I have a headache"
3. Watch the simulated streaming response

### Test Realtime Mode
1. Click the microphone button (🎤)
2. Allow microphone access
3. Watch for:
   - Waveform animation
   - Mock transcription after 2s
   - Mock AI response after 5s
   - Emergency state after 8s

### Test Video Mode
1. Enable realtime mode first
2. Click the video button (📹)
3. Allow camera access
4. See live preview with REC indicator

### Test Emergency Alerts
1. Enable realtime mode
2. Wait 8-11 seconds
3. See emergency alert card appear
4. Watch state progression

### Test Settings
1. Click settings icon (⚙️)
2. Toggle dark mode
3. Select devices from dropdowns
4. Enable/disable subtitles
5. Settings persist on page reload

---

## 🔍 Mock Behavior Details

### Mock Text Responses
```typescript
// Simulated responses include:
"I understand you're asking about: {your message}"
"Based on your message, here's what I can help with..."
"Thank you for sharing. In production, I would provide medical guidance."
"Remember: For emergencies, always call 108 or 112."
```

### Mock Realtime Timeline
```
0s:   Realtime mode activated
2s:   Transcription: "I'm listening..."
5s:   AI Response: "I can hear you clearly!"
8s:   Emergency State: DETECTING_URGENCY
11s:  Emergency State: GUIDING
```

### Console Logs
Open Developer Console to see:
```
[MOCK] Audio chunk captured: 2048 bytes
[MOCK] Video frame captured: 15360 bytes
```

---

## 📊 What Data is Captured?

### Audio Data
- ✅ Microphone audio is captured via MediaRecorder API
- ✅ Converted to PCM16 format
- ❌ NOT sent to any server (logged to console only)

### Video Data
- ✅ Camera video is captured
- ✅ Frames extracted as JPEG (320×240)
- ❌ NOT sent to any server (logged to console only)

### Chat Data
- ✅ All messages saved to localStorage
- ✅ Chat history persists across sessions
- ✅ Can be cleared manually via browser DevTools

---

## 🔧 Switching to Real Backend

When your backend is ready, follow these steps:

### 1. Update Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://your-backend.com
NEXT_PUBLIC_WS_BASE_URL=wss://your-backend.com
NEXT_PUBLIC_USE_MOCK=false
```

### 2. Uncomment WebSocket Code
In `app/chat/[id]/page.tsx`:
```typescript
// Uncomment this line:
import { initWebSocketManager, disconnectWebSocket } from "@/lib/websocket"

// Replace mock realtime mode with real WebSocket implementation
// (See original code in git history or README_FRONTEND.md)
```

### 3. Replace Mock Streaming
In `handleSendMessage` function, replace mock code with:
```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: activeChat, message }),
})
// Process streaming response...
```

---

## 🐛 Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS (or localhost)
- Try different browser
- Check console for errors

### Camera Not Working
- Check browser permissions
- Ensure HTTPS (or localhost)
- Try different device from settings
- Close other apps using camera

### No Mock Responses
- Check browser console for errors
- Ensure page fully loaded
- Try refreshing the page
- Clear browser cache

### Settings Not Persisting
- Check localStorage is enabled
- Not in private/incognito mode
- Browser storage not full

---

## 💡 Tips & Tricks

### Testing Emergency States
- Enable realtime mode and wait ~10 seconds
- Emergency states cycle automatically
- Click "Dismiss" to reset

### Testing Multiple Chats
- Create multiple chats via sidebar
- Each chat maintains separate history
- Delete chats with trash icon

### Testing Dark Mode
- Toggle via settings
- Persists across sessions
- Applies to all pages

### Debugging
- Open DevTools Console
- Look for `[MOCK]` prefixed logs
- Check Application > localStorage for saved data

---

## 📝 Mock vs Production Comparison

| Feature | Mock Mode | Production Mode |
|---------|-----------|-----------------|
| Text Chat | ✓ Simulated | ✓ Real LLM (OpenRouter/GPT) |
| Streaming | ✓ Word-by-word | ✓ Token-by-token |
| Voice Input | ✓ Captured, not sent | ✓ Sent to ASR |
| Transcription | ✓ Simulated | ✓ Real ASR |
| Video Input | ✓ Captured, not sent | ✓ Sent to backend |
| Emergency Detection | ✓ Simulated | ✓ Real AI detection |
| WebSocket | ✗ Disabled | ✓ Real-time bidirectional |
| Backend Required | ✗ No | ✓ Yes |

---

## 🎯 Use Cases for Mock Mode

✅ **Frontend Development** - Test UI without backend
✅ **Demo/Presentation** - Show features without server
✅ **Buildathon Submission** - Submit working frontend MVP
✅ **UI/UX Testing** - Test flows and interactions
✅ **Browser Compatibility** - Test across browsers
✅ **Offline Development** - Work without internet

---

## 📚 Additional Resources

- **Full Documentation**: `README_FRONTEND.md`
- **Quick Setup**: `QUICKSTART.md`
- **Build Summary**: `BUILD_SUMMARY.md`
- **Mock Utilities**: `lib/mock.ts`

---

## 🆘 Support

Having issues? Check:
1. Browser console for errors
2. Network tab for failed requests
3. Application > localStorage for saved data
4. Microphone/camera permissions

---

**🩺 Cura AI - Mock Mode Enabled**

*All features work out of the box! No backend, no setup, no hassle.* 🎉
