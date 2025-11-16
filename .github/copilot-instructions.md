# GitHub Copilot Instructions for Cura AI Platform

## Project Overview
Cura AI is a multilingual medical AI assistant platform with:
- **3 Backend Systems**: FastAPI (production RAG), Node.js (realtime streaming), Fastify (local testing)
- **2 Frontend Systems**: Next.js 14 (production), HTML test UI
- **RAG Pipeline**: Medical dataset embeddings → Pinecone vector database
- **LLM Provider**: OpenRouter API for multi-model support

---

## Core Architecture Principles

### 1. OpenRouter Integration
```typescript
// Always use OpenRouter API for LLM inference
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

// User will provide model IDs like:
// - meta-llama/llama-3.3-8b-instruct:free
// - anthropic/claude-3.5-sonnet
// - openai/gpt-4-turbo

// Streaming pattern for all LLM calls
async function streamCompletion(messages: Message[]) {
  const response = await axios.post(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    {
      model: process.env.OPENROUTER_MODEL_ID,
      messages: messages,
      stream: true
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SITE_URL,
        'X-Title': 'Cura AI Medical Assistant'
      },
      responseType: 'stream'
    }
  )
  
  // Parse SSE events
  for await (const chunk of response.data) {
    const lines = chunk.toString().split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        if (data.choices[0].delta.content) {
          yield data.choices[0].delta.content
        }
      }
    }
  }
}
```

### 2. Pinecone Vector Database Setup
```python
# User will provide these environment variables:
# PINECONE_API_KEY=pcsk_...
# PINECONE_ENVIRONMENT=us-east-1-aws
# PINECONE_INDEX_NAME=cura-medical-knowledge

from pinecone import Pinecone, ServerlessSpec

# Initialize Pinecone client
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))

# Create index with proper dimensions (user will specify embedding model)
# Common embedding models:
# - text-embedding-3-small (OpenAI) → 1536 dimensions
# - text-embedding-3-large (OpenAI) → 3072 dimensions
# - voyage-large-2-instruct (Voyage AI) → 1024 dimensions

def create_pinecone_index(index_name: str, dimension: int):
    """Create Pinecone index if it doesn't exist"""
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=dimension,  # User will provide based on embedding model
            metric='cosine',
            spec=ServerlessSpec(
                cloud='aws',
                region=os.getenv('PINECONE_ENVIRONMENT', 'us-east-1')
            )
        )
    return pc.Index(index_name)
```

### 3. Embedding Generation Pipeline
```python
# User will guide on which embedding model to use
# Always support these patterns:

# Option A: OpenAI Embeddings via OpenRouter
async def generate_embeddings_openai(texts: list[str]) -> list[list[float]]:
    """Generate embeddings using OpenAI models via OpenRouter"""
    response = await openai_client.embeddings.create(
        model="text-embedding-3-small",  # User will specify model
        input=texts
    )
    return [item.embedding for item in response.data]

# Option B: Voyage AI Embeddings (Recommended for medical content)
import voyageai
vo = voyageai.Client(api_key=os.getenv('VOYAGE_API_KEY'))

async def generate_embeddings_voyage(texts: list[str]) -> list[list[float]]:
    """Voyage AI has medical-optimized embeddings"""
    result = vo.embed(
        texts=texts,
        model="voyage-large-2-instruct",  # User will specify
        input_type="document"  # or "query" for search queries
    )
    return result.embeddings

# Option C: Sentence Transformers (Local/Free)
from sentence_transformers import SentenceTransformer

def generate_embeddings_local(texts: list[str], model_name: str) -> list[list[float]]:
    """Local embedding generation"""
    model = SentenceTransformer(model_name)  # e.g., 'all-MiniLM-L6-v2'
    embeddings = model.encode(texts)
    return embeddings.tolist()
```

---

## Workflow Instructions

### Phase 1: Environment Setup
When user starts working on embeddings:
1. **Ask for configuration**:
   ```
   Please provide:
   - PINECONE_API_KEY (from pinecone.io dashboard)
   - PINECONE_ENVIRONMENT (e.g., us-east-1-aws)
   - PINECONE_INDEX_NAME (e.g., cura-medical-qa)
   - Embedding model choice (OpenAI/Voyage/Local)
   - Embedding dimension (1536 for text-embedding-3-small)
   ```

2. **Create `.env` entries**:
   ```bash
   # Pinecone Configuration
   PINECONE_API_KEY=pcsk_your_key_here
   PINECONE_ENVIRONMENT=us-east-1-aws
   PINECONE_INDEX_NAME=cura-medical-knowledge
   
   # Embedding Model Configuration
   EMBEDDING_MODEL=text-embedding-3-small
   EMBEDDING_DIMENSION=1536
   EMBEDDING_PROVIDER=openai  # or: voyage, local
   
   # Voyage AI (if using)
   VOYAGE_API_KEY=pa-...
   
   # OpenRouter for LLM
   OPENROUTER_API_KEY=sk-or-v1-...
   OPENROUTER_MODEL_ID=meta-llama/llama-3.3-8b-instruct:free
   ```

### Phase 2: Dataset Processing
User has medical datasets in `curaai-datasets/` directory:
- MedMCQA, MedQA, PubMedQA, MedQuAD, BioASQ

1. **Run normalization script**:
   ```python
   # curaai-datasets/fetch_and_normalize.py
   # Converts all datasets to unified JSON schema:
   # {
   #   "question": "What causes type 2 diabetes?",
   #   "answer": "Type 2 diabetes is caused by...",
   #   "source": "medmcqa",
   #   "metadata": {...}
   # }
   
   python fetch_and_normalize.py
   ```

2. **Generate embeddings in batches**:
   ```python
   # curaai-datasets/index_all_collections.py
   
   import json
   from tqdm import tqdm
   
   def process_dataset_to_pinecone(
       dataset_path: str,
       index: pinecone.Index,
       embedding_fn: callable,
       batch_size: int = 100
   ):
       """Process dataset and upload to Pinecone"""
       with open(dataset_path) as f:
           data = json.load(f)
       
       for i in tqdm(range(0, len(data), batch_size)):
           batch = data[i:i+batch_size]
           
           # Combine question + answer for embedding
           texts = [
               f"Question: {item['question']}\nAnswer: {item['answer']}"
               for item in batch
           ]
           
           # Generate embeddings (user will have chosen the model)
           embeddings = await embedding_fn(texts)
           
           # Prepare vectors for Pinecone
           vectors = [
               {
                   'id': f"{item['source']}_{idx}",
                   'values': embedding,
                   'metadata': {
                       'question': item['question'],
                       'answer': item['answer'],
                       'source': item['source'],
                       **item.get('metadata', {})
                   }
               }
               for idx, (item, embedding) in enumerate(zip(batch, embeddings), start=i)
           ]
           
           # Upsert to Pinecone
           index.upsert(vectors=vectors)
   ```

### Phase 3: RAG Query Implementation
```python
# backend/app/modules/rag/service.py

class RAGService:
    def __init__(self):
        self.pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
        self.index = self.pc.Index(os.getenv('PINECONE_INDEX_NAME'))
        self.embedding_model = os.getenv('EMBEDDING_MODEL')
        self.embedding_provider = os.getenv('EMBEDDING_PROVIDER')
    
    async def retrieve_context(self, query: str, top_k: int = 5) -> list[dict]:
        """Retrieve relevant medical knowledge from Pinecone"""
        
        # Generate query embedding (must use SAME model as documents)
        if self.embedding_provider == 'openai':
            query_embedding = await generate_embeddings_openai([query])
        elif self.embedding_provider == 'voyage':
            query_embedding = await generate_embeddings_voyage([query])
        else:
            query_embedding = generate_embeddings_local([query], self.embedding_model)
        
        # Query Pinecone
        results = self.index.query(
            vector=query_embedding[0],
            top_k=top_k,
            include_metadata=True
        )
        
        # Extract context
        contexts = [
            {
                'question': match['metadata']['question'],
                'answer': match['metadata']['answer'],
                'source': match['metadata']['source'],
                'score': match['score']
            }
            for match in results['matches']
        ]
        
        return contexts
    
    async def generate_rag_response(self, user_query: str) -> str:
        """Full RAG pipeline: retrieve + generate"""
        
        # 1. Retrieve relevant context
        contexts = await self.retrieve_context(user_query, top_k=3)
        
        # 2. Build prompt with context
        context_text = "\n\n".join([
            f"Source: {ctx['source']}\nQ: {ctx['question']}\nA: {ctx['answer']}"
            for ctx in contexts
        ])
        
        messages = [
            {
                'role': 'system',
                'content': 'You are a medical AI assistant. Use the provided context to answer questions accurately.'
            },
            {
                'role': 'user',
                'content': f"Context:\n{context_text}\n\nQuestion: {user_query}\n\nProvide a clear, evidence-based answer."
            }
        ]
        
        # 3. Stream response from OpenRouter
        full_response = ""
        async for token in streamCompletion(messages):
            full_response += token
            yield token
        
        return full_response
```

---

## Backend Integration Patterns

### FastAPI Backend (Production with RAG)
```python
# backend/app/main.py

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from app.modules.rag.service import RAGService

app = FastAPI()
rag_service = RAGService()

@app.post("/v1/chat/completions")
async def chat_completion(request: ChatRequest):
    """Chat endpoint with RAG enhancement"""
    
    user_message = request.messages[-1]['content']
    
    # Use RAG for medical queries
    if is_medical_query(user_message):
        async def generate():
            async for token in rag_service.generate_rag_response(user_message):
                yield f"data: {json.dumps({'content': token})}\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
    
    # Regular OpenRouter call for non-medical queries
    else:
        async def generate():
            async for token in streamCompletion(request.messages):
                yield f"data: {json.dumps({'content': token})}\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
```

### Fastify Backend (Local Testing)
```javascript
// backend-local/src/server.js

const fastify = require('fastify')({ logger: true })
const { Pinecone } = require('@pinecone-database/pinecone')

// Initialize Pinecone
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
const index = pc.index(process.env.PINECONE_INDEX_NAME)

fastify.post('/v1/chat/rag', async (request, reply) => {
  const { query } = request.body
  
  // Generate embedding (user will choose provider)
  const embedding = await generateEmbedding(query)
  
  // Query Pinecone
  const results = await index.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true
  })
  
  // Build context
  const context = results.matches
    .map(m => `Q: ${m.metadata.question}\nA: ${m.metadata.answer}`)
    .join('\n\n')
  
  // Stream from OpenRouter with context
  reply.raw.setHeader('Content-Type', 'text/event-stream')
  
  for await (const token of streamOpenRouterCompletion([
    { role: 'system', content: 'You are a medical assistant.' },
    { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
  ])) {
    reply.raw.write(`data: ${JSON.stringify({ token })}\n\n`)
  }
  
  reply.raw.end()
})
```

---

## Testing & Validation

### 1. Verify Pinecone Index
```python
# Test script: scripts/test_pinecone.py

from pinecone import Pinecone
import os

pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
index = pc.Index(os.getenv('PINECONE_INDEX_NAME'))

# Check index stats
stats = index.describe_index_stats()
print(f"Total vectors: {stats['total_vector_count']}")
print(f"Dimension: {stats['dimension']}")
print(f"Namespaces: {stats['namespaces']}")

# Test query
test_embedding = [0.1] * int(os.getenv('EMBEDDING_DIMENSION'))
results = index.query(vector=test_embedding, top_k=3, include_metadata=True)
print(f"\nSample results: {len(results['matches'])} matches")
for match in results['matches']:
    print(f"- {match['metadata']['source']}: {match['score']:.4f}")
```

### 2. Verify RAG Pipeline
```bash
# Test RAG endpoint
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "messages": [
      {"role": "user", "content": "What are the symptoms of type 2 diabetes?"}
    ],
    "stream": true
  }'
```

---

## Common Patterns & Best Practices

### 1. Always Ask User for Model IDs
```
❌ DON'T hardcode: model="gpt-4"
✅ DO use env vars: model=os.getenv('OPENROUTER_MODEL_ID')
✅ DO ask user: "Which OpenRouter model would you like to use?"
```

### 2. Embedding Consistency
```
⚠️ CRITICAL: Query embeddings MUST use the same model as document embeddings
✅ Store embedding model info in Pinecone metadata
✅ Validate model match before querying
```

### 3. Batch Processing
```python
# Always process in batches to avoid rate limits
BATCH_SIZE = 100  # Adjust based on embedding provider limits
for i in range(0, len(documents), BATCH_SIZE):
    batch = documents[i:i+BATCH_SIZE]
    embeddings = await generate_embeddings(batch)
    index.upsert(vectors=prepare_vectors(batch, embeddings))
    await asyncio.sleep(1)  # Rate limit protection
```

### 4. Error Handling
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def generate_embeddings_with_retry(texts: list[str]):
    """Retry embedding generation on failures"""
    try:
        return await generate_embeddings(texts)
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise
```

---

## User Interaction Guidelines

### When User Says "Create Embeddings"
1. ✅ Ask: "Which embedding model? (OpenAI/Voyage/Local)"
2. ✅ Ask: "What dimension? (e.g., 1536 for text-embedding-3-small)"
3. ✅ Confirm: "I'll create a Pinecone index with dimension X"
4. ✅ Show: Code with placeholder for their API keys

### When User Says "Upload to Pinecone"
1. ✅ Ask: "Do you have PINECONE_API_KEY ready?"
2. ✅ Ask: "Which index name? (default: cura-medical-knowledge)"
3. ✅ Confirm: "I'll process datasets in batches of 100"
4. ✅ Show: Progress tracking code with tqdm

### When User Says "Test RAG"
1. ✅ Ask: "Which backend? (FastAPI/Fastify)"
2. ✅ Confirm: "I'll create a test endpoint with context retrieval"
3. ✅ Show: curl command for testing
4. ✅ Validate: Check if embeddings match query model

---

## Environment Variables Checklist

User must provide before starting:
```bash
# OpenRouter (LLM)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL_ID=meta-llama/llama-3.3-8b-instruct:free

# Pinecone (Vector DB)
PINECONE_API_KEY=pcsk_...
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=cura-medical-knowledge

# Embeddings (User will specify)
EMBEDDING_PROVIDER=openai  # or: voyage, local
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536

# Optional: Voyage AI
VOYAGE_API_KEY=pa-...
```

---

## File Structure Reference

```
curaai-platform/
├── backend/                    # FastAPI production (RAG-enabled)
│   ├── app/modules/rag/       # RAG service with Pinecone
│   └── .env                   # Add Pinecone keys here
├── backend-realtime/          # Node.js WebSocket server
├── backend-local/             # Fastify test server
│   └── .env                   # Add all keys here for local testing
├── curaai-datasets/           # Medical datasets
│   ├── fetch_and_normalize.py # Download & normalize datasets
│   ├── index_all_collections.py # Generate embeddings & upload
│   └── data/                  # Normalized JSON files
├── frontend/                  # Next.js production UI
├── scripts/
│   ├── test_pinecone.py      # Verify Pinecone connection
│   └── test_embeddings.py    # Test embedding generation
└── .env.example              # Template with all required keys
```

---

## Decision Tree for Development

```
User request: "Create embeddings"
├─ Has datasets? 
│  ├─ Yes → Run fetch_and_normalize.py first
│  └─ No → Guide to download datasets
├─ Chosen embedding model?
│  ├─ Not yet → Ask for provider & model
│  └─ Yes → Verify dimension matches
├─ Pinecone setup?
│  ├─ Not yet → Guide to create index
│  └─ Yes → Proceed with batch upload
└─ Test RAG pipeline after upload

User request: "Update model ID"
├─ Which model? (LLM vs Embedding)
│  ├─ LLM → Update OPENROUTER_MODEL_ID
│  └─ Embedding → Warn about re-indexing needed
└─ Update .env and restart servers

User request: "Test backend"
├─ Which backend?
│  ├─ FastAPI → Start with uvicorn
│  ├─ Fastify → Start with node
│  └─ Realtime → Start WebSocket server
├─ RAG enabled?
│  ├─ Yes → Test /v1/chat/rag endpoint
│  └─ No → Test /v1/chat/completions
└─ Show curl/frontend test command
```

---

## Quick Commands Reference

```bash
# Setup Pinecone index
python scripts/create_pinecone_index.py --dimension 1536

# Generate embeddings from datasets
cd curaai-datasets
python fetch_and_normalize.py
python index_all_collections.py --provider openai --batch-size 100

# Start backends with RAG
cd backend && uvicorn app.main:app --reload
cd backend-local && node src/server.js

# Test RAG endpoint
curl -X POST http://localhost:8000/v1/chat/rag \
  -H "Content-Type: application/json" \
  -d '{"query": "What is diabetes?"}'

# Verify Pinecone stats
python scripts/test_pinecone.py
```

---

## Important Notes

1. **User controls all model IDs** - Never hardcode, always use environment variables
2. **Embedding consistency is critical** - Query and document embeddings must use identical models
3. **Batch processing prevents rate limits** - Process 100-200 items per batch
4. **Progress tracking is essential** - Use tqdm for long-running embedding jobs
5. **Error handling with retries** - Network issues are common, implement exponential backoff
6. **Metadata is valuable** - Store source, timestamps, and model info in Pinecone metadata
7. **Test incrementally** - Verify each step (dataset → embeddings → Pinecone → RAG)

---

## Final Checklist Before Production

- [ ] User provided all API keys (OpenRouter, Pinecone, embedding provider)
- [ ] User confirmed embedding model and dimension
- [ ] Pinecone index created with correct dimension
- [ ] Datasets normalized to unified JSON schema
- [ ] Embeddings generated and uploaded (verify vector count)
- [ ] RAG service implemented in chosen backend
- [ ] Test queries return relevant context (score > 0.7)
- [ ] Frontend integrated with RAG endpoint
- [ ] Error handling and retries implemented
- [ ] Monitoring/logging added for production

---

**Remember**: This is a collaborative process. User will guide the embedding model choice and provide API keys. Your role is to implement the pipeline correctly and ask clarifying questions when needed.
