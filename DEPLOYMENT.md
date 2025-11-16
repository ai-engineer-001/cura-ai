# 🚀 Deployment Guide - Cura AI Platform

## 📦 **Production Deployment**

### **Backend → Render.com**

1. **Push to GitHub:**
   ```bash
   cd curai-backend
   git init
   git add .
   git commit -m "Initial backend commit"
   git remote add origin https://github.com/yourusername/cura-backend.git
   git push -u origin main
   ```

2. **Deploy on Render.com:**
   - Go to [render.com](https://render.com) → New Web Service
   - Connect your GitHub repository
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node 18+

3. **Set Environment Variables in Render Dashboard:**
   ```
   NODE_ENV=production
   PORT=3000
   OPENROUTER_API_KEY=your_key_here
   PINECONE_API_KEY=your_key_here
   PINECONE_HOST=your-index.svc.pinecone.io
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

4. **Get your backend URL:** `https://your-backend.onrender.com`

---

### **Frontend → Vercel**

1. **Update `.env.production`:**
   ```bash
   cd frontend-new
   nano .env.production
   ```
   Update with your Render backend URL:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api
   NEXT_PUBLIC_WS_BASE_URL=wss://your-backend.onrender.com
   ```

2. **Deploy on Vercel:**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```
   
   Or use Vercel Dashboard:
   - Import from GitHub
   - Framework: Next.js
   - Install Command: `npm install --legacy-peer-deps`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables in Vercel:**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api
   NEXT_PUBLIC_WS_BASE_URL=wss://your-backend.onrender.com
   NEXT_PUBLIC_USE_MOCK=false
   ```

---

## 🔧 **Local Development**

### **Option 1: Full Stack Local**

Terminal 1 - Backend:
```bash
cd curai-backend
npm run dev:local
# Runs on http://localhost:3000
```

Terminal 2 - Frontend:
```bash
cd frontend-new
npm run dev:local
# Runs on http://localhost:3001
```

Open browser: `http://localhost:3001`

---

### **Option 2: Frontend Local + Backend Production**

Test your frontend against production backend:
```bash
cd frontend-new
npm run dev:prod
# Uses production backend URL from .env.production
```

---

## 🧪 **Preview Before Deployment**

### **Backend Preview:**
```bash
cd curai-backend
npm start
# Test at http://localhost:3000/api/health
```

### **Frontend Production Build Preview:**
```bash
cd frontend-new
npm run preview
# Builds and serves production version locally
```

---

## 📋 **Deployment Checklist**

### **Backend (Render.com):**
- [ ] Environment variables configured
- [ ] CORS origins include your Vercel URL
- [ ] Pinecone connection working
- [ ] OpenRouter API key valid
- [ ] Health endpoint accessible: `/api/health`

### **Frontend (Vercel):**
- [ ] Backend URL updated in `.env.production`
- [ ] Build succeeds: `npm run build`
- [ ] Environment variables set in Vercel
- [ ] API calls work from production domain

---

## 🐛 **Troubleshooting**

### **CORS Errors:**
Add your Vercel URL to backend `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-preview.vercel.app
```

### **WebSocket Connection Failed:**
Ensure backend URL uses `wss://` (not `ws://`) for production

### **API 404 Errors:**
Check backend logs on Render.com dashboard

---

## 🔗 **URLs After Deployment**

- **Backend API:** `https://your-backend.onrender.com/api`
- **Frontend:** `https://your-app.vercel.app`
- **Health Check:** `https://your-backend.onrender.com/api/health`
