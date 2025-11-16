# 🚀 Quick Start - Cura AI Platform

## 📦 **Local Preview (Recommended)**

### **Full Stack Local Development:**
```powershell
.\preview-fullstack.ps1
```
- Opens both backend (3000) and frontend (3001)
- Automatically opens browser to http://localhost:3001

### **Backend Only:**
```powershell
.\preview-backend.ps1
```
- Backend runs on http://localhost:3000
- Test API: http://localhost:3000/api/health

### **Frontend Only:**
```powershell
.\preview-frontend.ps1
```
- Frontend runs on http://localhost:3001
- **Note:** Requires backend running on port 3000

---

## ☁️ **Production Deployment**

### **1. Deploy Backend to Render.com:**
```bash
cd curai-backend
# Update .env.production with your keys
# Push to GitHub and connect to Render
# Set environment variables in Render dashboard
```

### **2. Deploy Frontend to Vercel:**
```bash
cd frontend-new
# Update .env.production with Render backend URL
vercel --prod
# Or use Vercel GitHub integration
```

📖 **Full deployment guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔑 **Environment Files**

### **Backend:**
- `.env.local` - Local development (port 3000)
- `.env.production` - Render.com deployment
- `.env` - Active config (auto-copied by scripts)

### **Frontend:**
- `.env.local` - Local development (connects to localhost:3000)
- `.env.production` - Vercel deployment (connects to Render)
- `.env.development.local` - Active config (auto-copied)

---

## 🎯 **What You Get**

### **Backend (curai-backend/):**
- ✅ Node.js + Fastify
- ✅ Pinecone RAG integration
- ✅ OpenRouter LLM streaming
- ✅ WebSocket realtime voice
- ✅ Hybrid fallback system
- ✅ Emergency detection

### **Frontend (frontend-new/):**
- ✅ Next.js 14 with App Router
- ✅ Voice input/output (Web Speech API)
- ✅ Video streaming
- ✅ Real-time chat with RAG
- ✅ Confidence level display
- ✅ Emergency alerts

---

## 🔗 **API Endpoints**

- `GET /api/health` - Health check
- `POST /api/search` - RAG text query
- `GET /api/embed/stats` - Pinecone statistics
- `WS /ws/realtime` - WebSocket voice streaming

---

## 📁 **Project Structure**

```
curaai-platform/
├── curai-backend/         # Production backend
│   ├── src/               # Server code
│   ├── .env.local         # Local config
│   └── .env.production    # Production config
│
├── frontend-new/          # Production frontend
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   ├── lib/               # API client & utils
│   ├── .env.local         # Local config
│   └── .env.production    # Production config
│
├── curaai-datasets/       # Medical datasets
│
├── preview-fullstack.ps1  # Run both locally
├── preview-backend.ps1    # Backend only
├── preview-frontend.ps1   # Frontend only
└── DEPLOYMENT.md          # Full deployment guide
```

---

## ⚡ **Quick Commands**

```powershell
# Preview full stack
.\preview-fullstack.ps1

# Just backend
.\preview-backend.ps1

# Just frontend
.\preview-frontend.ps1

# Stop all Node processes
Get-Process -Name node | Stop-Process -Force
```

---

## 🐛 **Troubleshooting**

### **Port already in use:**
```powershell
Get-Process -Name node | Stop-Process -Force
```

### **Dependencies missing:**
```bash
cd curai-backend && npm install
cd frontend-new && npm install --legacy-peer-deps
```

### **CORS errors:**
Check `ALLOWED_ORIGINS` in backend `.env`

---

## 📚 **Next Steps**

1. ✅ Run local preview: `.\preview-fullstack.ps1`
2. ✅ Test voice mode and chat
3. ✅ Deploy backend to Render.com
4. ✅ Deploy frontend to Vercel
5. ✅ Update CORS and environment URLs
6. ✅ Test production deployment

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides!
