# Cura AI Platform - Setup Guide

Complete setup instructions for the Cura AI Medical Assistant Platform.

## Prerequisites

### Required Software
- Docker Desktop (latest version)
- Git
- Code editor (VS Code recommended)

### API Keys Required
- **OpenAI API Key** - Get from https://platform.openai.com/api-keys
- **Pinecone API Key** - Get from https://www.pinecone.io/

## Quick Start (5 minutes)

### 1. Clone and Setup

```powershell
# Clone the repository
git clone <your-repo-url>
cd curaai-platform

# Copy environment file
Copy-Item .env.example .env

# Edit .env file with your API keys
notepad .env
```

### 2. Configure Environment Variables

Edit `.env` and add your API keys:

```env
# Required - Get from OpenAI
OPENAI_API_KEY=sk-your-actual-openai-key-here

# Required - Get from Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
PINECONE_INDEX_NAME=cura-medical-kb

# JWT Secret (change in production)
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-characters
```

### 3. Start the Platform

```powershell
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 5. Test Login

Use these demo credentials:
- Email: `demo@cura.ai`
- Password: `demo123`

## Development Setup

### Backend Development

```powershell
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Development

```powershell
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## Docker Commands

### Start Services
```powershell
docker-compose up -d
```

### Stop Services
```powershell
docker-compose down
```

### Rebuild After Code Changes
```powershell
docker-compose up -d --build
```

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Reset Everything
```powershell
docker-compose down -v
docker-compose up -d --build
```

## Troubleshooting

### Port Already in Use

If ports 3000, 8000, 5432, or 6379 are already in use:

1. Stop conflicting services
2. Or modify ports in `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Change 3001 to any available port
  backend:
    ports:
      - "8001:8000"  # Change 8001 to any available port
```

### API Keys Not Working

1. Ensure no leading/trailing spaces in `.env`
2. Restart Docker containers after changing `.env`:
```powershell
docker-compose down
docker-compose up -d
```

### Pinecone Index Not Found

1. Create index manually in Pinecone dashboard
2. Dimensions: `3072` (for text-embedding-3-large)
3. Metric: `cosine`
4. Update `PINECONE_INDEX_NAME` in `.env`

### Frontend Not Loading

1. Check frontend logs:
```powershell
docker-compose logs frontend
```

2. Rebuild frontend:
```powershell
docker-compose up -d --build frontend
```

### Database Connection Issues

```powershell
# Reset database
docker-compose down -v
docker-compose up -d db
# Wait 10 seconds
docker-compose up -d backend
```

## Production Deployment

### Environment Variables for Production

1. Change all secret keys in `.env`
2. Set strong JWT secret (minimum 32 characters)
3. Use production database URLs
4. Enable HTTPS
5. Set `NODE_ENV=production`
6. Set `PYTHON_ENV=production`

### Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure backup strategy
- [ ] Set up monitoring/logging
- [ ] Review API key permissions

### Build for Production

```powershell
# Build images
docker-compose build

# Start in production mode
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Monitoring

### Health Checks

```powershell
# Backend health
curl http://localhost:8000/api/v1/health

# Frontend
curl http://localhost:3000
```

### Database Access

```powershell
# PostgreSQL
docker-compose exec db psql -U postgres -d curaai

# Redis
docker-compose exec redis redis-cli
```

## Backup & Restore

### Backup Database

```powershell
docker-compose exec db pg_dump -U postgres curaai > backup.sql
```

### Restore Database

```powershell
Get-Content backup.sql | docker-compose exec -T db psql -U postgres curaai
```

## Performance Optimization

### For Development
- Use Docker volumes for hot-reloading
- Limit resource usage in Docker Desktop

### For Production
- Use production builds
- Enable caching (Redis)
- Configure connection pooling
- Set up CDN for static assets
- Monitor resource usage

## Getting Help

1. Check logs: `docker-compose logs -f`
2. Review API documentation: http://localhost:8000/docs
3. Check GitHub issues
4. Review error messages in browser console

## Next Steps

1. ✅ Platform is running
2. 📚 Load medical datasets (see DATA_SETUP.md)
3. 🧪 Test with sample queries
4. 🎨 Customize UI theme
5. 📊 Set up monitoring
6. 🔒 Configure production security

## Additional Resources

- FastAPI Documentation: https://fastapi.tiangolo.com/
- Next.js Documentation: https://nextjs.org/docs
- Docker Documentation: https://docs.docker.com/
- Pinecone Documentation: https://docs.pinecone.io/
- OpenAI API Reference: https://platform.openai.com/docs/
