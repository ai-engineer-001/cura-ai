# Cura AI - Medical Assistant Platform

A production-ready AI-powered medical assistant platform with conversational interface, specialized for medical Q&A and diagnostic support.

## Features

- 🤖 **GPT-4.1 Integration** - Advanced conversational AI for medical queries
- 🔍 **RAG Pipeline** - Retrieval-Augmented Generation with Pinecone vector database
- 🌐 **Multilingual Support** - Interface available in multiple languages
- 📄 **File Upload** - Support for medical documents and images
- 🎯 **Context Control** - Adjustable retrieval depth and accuracy
- 👨‍⚕️ **Dual Modes** - Patient-friendly and clinician modes
- 🔐 **Authentication** - Secure JWT-based user authentication
- 📚 **Citations** - Medical literature references with each response
- 🐳 **Docker Ready** - Complete containerization for easy deployment

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **GPT-4.1** - OpenAI's advanced language model
- **Pinecone** - Vector database for semantic search
- **PostgreSQL** - Relational database
- **Redis** - Caching layer

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **i18next** - Internationalization
- **Shadcn/ui** - Beautiful UI components

## Quick Start

### 🎨 Frontend Only (Recommended for Quick Start)

No backend setup required! The frontend works standalone with mock data.

```powershell
cd frontend
npm install
npm run dev
```

**Demo Login:**
- Email: `demo@cura.ai` / Password: `demo123`
- Email: `doctor@cura.ai` / Password: `doctor123`

See [frontend/MOCK_MODE.md](frontend/MOCK_MODE.md) for details.

### 🚀 Full Stack Setup

Prerequisites: Docker, OpenAI API key, Pinecone API key

1. **Clone the repository**
```bash
git clone <repository-url>
cd curaai-platform
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. **Start the platform**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

**To use real backend:** Edit `frontend/src/lib/api/client.ts` and follow instructions to enable real API client.

## Development

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
curaai-platform/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Configuration

### RAG Parameters
- `RAG_TOP_K`: Number of documents to retrieve (default: 5)
- `RAG_SIMILARITY_THRESHOLD`: Minimum similarity score (default: 0.7)
- `RAG_CONTEXT_WINDOW`: Maximum context tokens (default: 4000)

### Safety & Compliance
- All responses include medical disclaimers
- No direct diagnosis - decision support only
- HIPAA-compliant data handling
- Audit logging for all interactions

## Datasets

The platform is designed to work with:
- PubMed abstracts and PMC articles
- MedQA and PubMedQA datasets
- MIMIC-III/IV clinical notes
- BioASQ biomedical datasets
- USMLE-style exam questions

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

MIT License - See LICENSE file for details

## Disclaimer

This platform is for educational and research purposes. Always consult qualified healthcare professionals for medical advice.
