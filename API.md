# API Documentation - Cura AI Platform

Complete API reference for the Cura AI backend.

## Base URL

```
http://localhost:8000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### Register User

```http
POST /v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "full_name": "John Doe",
  "role": "patient"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "patient",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00"
  }
}
```

#### Login

```http
POST /v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:** Same as register

### Chat

#### Send Message

```http
POST /v1/chat/message
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "What are the symptoms of diabetes?",
  "conversation_id": "optional-conversation-id",
  "mode": "patient",
  "language": "en",
  "use_rag": true,
  "rag_top_k": 5
}
```

**Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Diabetes symptoms include...",
    "timestamp": "2024-01-01T00:00:00",
    "citations": [
      {
        "id": "doc1",
        "score": 0.92,
        "source": "PubMed",
        "title": "Diabetes Overview"
      }
    ]
  },
  "conversation_id": "conv-123",
  "processing_time": 2.5,
  "model_used": "gpt-4-turbo-preview"
}
```

#### Stream Message

```http
POST /v1/chat/stream
```

**Request Body:** Same as send message

**Response:** Server-Sent Events (SSE)

```
data: {"conversation_id": "conv-123"}
data: {"content": "Diabetes ", "done": false}
data: {"content": "symptoms ", "done": false}
data: {"content": "include...", "done": false}
data: {"content": "", "done": true}
```

#### Get Conversations

```http
GET /v1/chat/conversations
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-123",
      "title": "Conversation 1",
      "message_count": 10,
      "last_updated": "2024-01-01T00:00:00"
    }
  ]
}
```

#### Get Conversation

```http
GET /v1/chat/conversations/{conversation_id}
```

**Response:**
```json
{
  "conversation_id": "conv-123",
  "messages": [
    {
      "role": "user",
      "content": "What is diabetes?",
      "timestamp": "2024-01-01T00:00:00"
    },
    {
      "role": "assistant",
      "content": "Diabetes is...",
      "timestamp": "2024-01-01T00:00:01"
    }
  ]
}
```

### RAG (Knowledge Base)

#### Search Documents

```http
POST /v1/rag/search
```

**Request Body:**
```json
{
  "query": "diabetes treatment",
  "top_k": 5,
  "threshold": 0.7,
  "filters": {
    "category": "endocrinology"
  }
}
```

**Response:**
```json
{
  "documents": [
    {
      "id": "doc1",
      "content": "Diabetes treatment involves...",
      "metadata": {
        "title": "Diabetes Treatment Guidelines",
        "source": "PubMed",
        "category": "endocrinology"
      },
      "score": 0.92
    }
  ],
  "query": "diabetes treatment",
  "total_results": 5
}
```

#### Get RAG Stats

```http
GET /v1/rag/stats
```

**Response:**
```json
{
  "status": "available",
  "total_vectors": 10000,
  "dimension": 3072,
  "index_fullness": 0.05
}
```

#### Upsert Documents (Admin Only)

```http
POST /v1/rag/upsert
```

**Request Body:**
```json
[
  {
    "id": "doc1",
    "content": "Medical content...",
    "source": "PubMed",
    "metadata": {
      "title": "Document Title",
      "category": "cardiology"
    }
  }
]
```

**Response:**
```json
{
  "message": "Successfully upserted 1 documents"
}
```

### File Upload

#### Upload File

```http
POST /v1/upload/file
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
file: <binary file data>
```

**Response:**
```json
{
  "filename": "medical_report.pdf",
  "file_type": "pdf",
  "file_size": 1048576,
  "upload_url": "/uploads/abc123.pdf"
}
```

#### Analyze File

```http
POST /v1/upload/analyze
```

**Form Data:**
```
file: <binary file data>
```

**Response:**
```json
{
  "filename": "lab_results.pdf",
  "text_content": "Extracted text from document...",
  "metadata": {
    "file_type": "pdf",
    "file_size": 1048576,
    "entities": ["blood pressure", "cholesterol", "glucose"]
  },
  "analysis": "Medical document analysis results..."
}
```

#### Delete File

```http
DELETE /v1/upload/file/{filename}
```

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

### Health

#### Health Check

```http
GET /v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "openai": "healthy",
    "pinecone": "available"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

- **Authentication**: 10 requests/minute
- **Chat**: 30 requests/minute
- **RAG Search**: 60 requests/minute
- **File Upload**: 10 requests/minute

## Interactive Documentation

Visit these URLs when the backend is running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Code Examples

### Python

```python
import requests

# Login
response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={
        "email": "user@example.com",
        "password": "password"
    }
)
token = response.json()["access_token"]

# Send chat message
response = requests.post(
    "http://localhost:8000/api/v1/chat/message",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "message": "What is hypertension?",
        "mode": "patient",
        "language": "en",
        "use_rag": True
    }
)
print(response.json())
```

### JavaScript/TypeScript

```typescript
// Login
const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});
const { access_token } = await loginResponse.json();

// Send chat message
const chatResponse = await fetch('http://localhost:8000/api/v1/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    message: 'What is hypertension?',
    mode: 'patient',
    language: 'en',
    use_rag: true
  })
});
const data = await chatResponse.json();
console.log(data);
```

### cURL

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Send chat message
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is hypertension?",
    "mode": "patient",
    "language": "en",
    "use_rag": true
  }'
```

## WebSocket Support (Future)

Real-time chat streaming via WebSockets will be added in future versions:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.content);
};
```

## SDK (Future)

Official SDKs planned for:
- Python
- JavaScript/TypeScript
- Swift (iOS)
- Kotlin (Android)
