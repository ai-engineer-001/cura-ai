# 🚀 Quick Start Guide - Cura AI Frontend

## Immediate Setup (5 minutes)

### 1. Environment Configuration
Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_WS_BASE_URL`: WebSocket URL (default: ws://localhost:8000)

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Open Browser
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🎯 Key Features to Test

### Text Chat
1. Click "Get Started" on homepage
2. Type a medical query
3. See streaming AI response

### Realtime Mode
1. Click microphone icon in chat
2. Allow mic permissions
3. Speak naturally
4. See live transcription

### Video Mode
1. Enable realtime mode first
2. Click camera icon
3. Allow camera access
4. Video frames auto-sent

### Emergency Alerts
System automatically detects and displays emergency states with guidance.

---

## 📦 What's Included

✅ **Complete Chat Interface**
- Message history
- Streaming responses
- Markdown support
- Smooth animations

✅ **Realtime Voice Mode**
- WebSocket integration
- Audio recording (PCM16)
- Live waveform visualization
- ASR transcription display

✅ **Video Streaming**
- Camera capture
- Frame extraction (JPEG)
- Preview display
- Device selection

✅ **Emergency System**
- State detection
- Alert cards
- Emergency calling
- Guided instructions

✅ **Settings & Preferences**
- Light/Dark mode
- Device selection
- Subtitle toggle
- Persistent storage

✅ **State Management**
- Zustand store
- localStorage persistence
- Global state access

✅ **Utility Functions**
- WebSocket manager
- Audio processing
- Video capture
- Helper utils

---

## 🛠 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Dependency Conflicts
```bash
npm install --legacy-peer-deps --force
```

### Clear Cache
```bash
rm -rf .next node_modules
npm install --legacy-peer-deps
```

---

## 📚 Documentation

Full documentation available in `README_FRONTEND.md`

## 🎉 You're Ready!

Your Cura AI frontend is now set up and ready for the Buildathon MVP!
