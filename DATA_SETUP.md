# Data Setup Guide - Cura AI Platform

Instructions for loading medical datasets into the RAG system.

## Overview

The Cura AI platform uses a Retrieval-Augmented Generation (RAG) system with Pinecone vector database to provide context-aware medical responses.

## Supported Datasets

### 1. PubMed Abstracts
- **Source**: https://pubmed.ncbi.nlm.nih.gov/
- **Format**: XML, JSON
- **Size**: Millions of medical abstracts
- **Use Case**: General medical knowledge

### 2. PubMedQA
- **Source**: https://pubmedqa.github.io/
- **Format**: JSON
- **Size**: ~1,000 expert-annotated Q&A pairs
- **Use Case**: Medical question answering

### 3. MedQA (USMLE)
- **Source**: https://github.com/jind11/MedQA
- **Format**: JSON
- **Size**: ~60,000 multiple-choice questions
- **Use Case**: Clinical reasoning, diagnostics

### 4. MIMIC-III/IV
- **Source**: https://mimic.mit.edu/
- **Format**: CSV, SQL
- **Size**: De-identified clinical notes
- **Use Case**: Clinical narratives
- **Note**: Requires credentialing

### 5. BioASQ
- **Source**: http://bioasq.org/
- **Format**: JSON
- **Size**: Biomedical Q&A
- **Use Case**: Specialized medical queries

## Quick Start with Sample Data

### Using Mock Data (Development)

The platform includes mock data for testing:

```python
# backend/scripts/load_sample_data.py
import asyncio
from app.services.rag_service import rag_service

sample_documents = [
    {
        "id": "doc1",
        "content": "Hypertension (high blood pressure) is defined as blood pressure readings consistently above 140/90 mmHg. It's a major risk factor for cardiovascular disease.",
        "source": "medical-knowledge",
        "metadata": {
            "title": "Hypertension Overview",
            "category": "cardiology",
            "confidence": 0.95
        }
    },
    {
        "id": "doc2",
        "content": "Type 2 diabetes is characterized by insulin resistance and relative insulin deficiency. Management includes lifestyle modifications, metformin as first-line therapy, and monitoring HbA1c levels.",
        "source": "medical-knowledge",
        "metadata": {
            "title": "Type 2 Diabetes Management",
            "category": "endocrinology",
            "confidence": 0.93
        }
    },
    {
        "id": "doc3",
        "content": "Common cold symptoms include runny nose, sore throat, cough, congestion, and mild body aches. Treatment is supportive: rest, fluids, and over-the-counter symptom relief.",
        "source": "medical-knowledge",
        "metadata": {
            "title": "Common Cold Treatment",
            "category": "general-medicine",
            "confidence": 0.90
        }
    }
]

async def load_data():
    await rag_service.upsert_documents(sample_documents)
    print("Sample data loaded successfully!")

if __name__ == "__main__":
    asyncio.run(load_data())
```

Run the script:

```powershell
cd backend
python scripts/load_sample_data.py
```

## Loading Real Datasets

### 1. PubMedQA Dataset

```python
# backend/scripts/load_pubmedqa.py
import json
import asyncio
from app.services.rag_service import rag_service

async def load_pubmedqa():
    # Download from https://pubmedqa.github.io/
    with open('data/pubmedqa.json', 'r') as f:
        data = json.load(f)
    
    documents = []
    for idx, (key, item) in enumerate(data.items()):
        doc = {
            "id": f"pubmedqa_{key}",
            "content": f"Question: {item['QUESTION']}\n\nContext: {' '.join(item['CONTEXTS'])}\n\nAnswer: {item['final_decision']}",
            "source": "PubMedQA",
            "metadata": {
                "title": item['QUESTION'],
                "category": "qa",
                "pmid": key,
                "confidence": 0.92
            }
        }
        documents.append(doc)
        
        # Batch upload every 100 documents
        if len(documents) >= 100:
            await rag_service.upsert_documents(documents)
            documents = []
            print(f"Processed {idx + 1} documents...")
    
    # Upload remaining documents
    if documents:
        await rag_service.upsert_documents(documents)
    
    print("PubMedQA data loaded successfully!")

if __name__ == "__main__":
    asyncio.run(load_pubmedqa())
```

### 2. MedQA Dataset

```python
# backend/scripts/load_medqa.py
import json
import asyncio
from app.services.rag_service import rag_service

async def load_medqa():
    with open('data/medqa_train.json', 'r') as f:
        data = json.load(f)
    
    documents = []
    for idx, item in enumerate(data):
        options_text = '\n'.join([f"{k}: {v}" for k, v in item['options'].items()])
        doc = {
            "id": f"medqa_{idx}",
            "content": f"Clinical Question: {item['question']}\n\nOptions:\n{options_text}\n\nCorrect Answer: {item['answer_idx']} - {item['options'][item['answer_idx']]}",
            "source": "MedQA",
            "metadata": {
                "title": item['question'][:100],
                "category": "clinical-reasoning",
                "difficulty": "usmle",
                "confidence": 0.90
            }
        }
        documents.append(doc)
        
        if len(documents) >= 100:
            await rag_service.upsert_documents(documents)
            documents = []
            print(f"Processed {idx + 1} documents...")
    
    if documents:
        await rag_service.upsert_documents(documents)
    
    print("MedQA data loaded successfully!")

if __name__ == "__main__":
    asyncio.run(load_medqa())
```

### 3. PubMed Abstracts (Custom)

```python
# backend/scripts/load_pubmed.py
import asyncio
from Bio import Entrez
from app.services.rag_service import rag_service

Entrez.email = "your-email@example.com"

async def fetch_and_load_pubmed(query, max_results=1000):
    # Search PubMed
    handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results)
    record = Entrez.read(handle)
    id_list = record["IdList"]
    
    documents = []
    for i, pmid in enumerate(id_list):
        # Fetch abstract
        handle = Entrez.efetch(db="pubmed", id=pmid, rettype="abstract", retmode="text")
        abstract = handle.read()
        
        doc = {
            "id": f"pubmed_{pmid}",
            "content": abstract,
            "source": "PubMed",
            "metadata": {
                "pmid": pmid,
                "category": "research",
                "confidence": 0.88
            }
        }
        documents.append(doc)
        
        if len(documents) >= 50:
            await rag_service.upsert_documents(documents)
            documents = []
            print(f"Processed {i + 1}/{len(id_list)} articles...")
    
    if documents:
        await rag_service.upsert_documents(documents)
    
    print(f"Loaded {len(id_list)} PubMed abstracts!")

if __name__ == "__main__":
    query = "diabetes mellitus treatment"
    asyncio.run(fetch_and_load_pubmed(query, max_results=500))
```

## Data Processing Best Practices

### 1. Chunk Large Documents

```python
def chunk_document(content, chunk_size=1000, overlap=200):
    """Split large documents into smaller chunks"""
    chunks = []
    for i in range(0, len(content), chunk_size - overlap):
        chunk = content[i:i + chunk_size]
        chunks.append(chunk)
    return chunks
```

### 2. Add Metadata

Always include:
- `source`: Where the data came from
- `title`: Document title
- `category`: Medical specialty or topic
- `confidence`: Quality/relevance score
- `date`: Publication date (if available)

### 3. Batch Processing

Process in batches of 50-100 documents to avoid rate limits:

```python
BATCH_SIZE = 100

for i in range(0, len(documents), BATCH_SIZE):
    batch = documents[i:i + BATCH_SIZE]
    await rag_service.upsert_documents(batch)
    await asyncio.sleep(1)  # Rate limiting
```

## Verify Data Loading

### Check Pinecone Index Stats

```python
# backend/scripts/check_stats.py
import asyncio
from app.services.rag_service import rag_service

async def check_stats():
    stats = rag_service.get_stats()
    print(f"Total vectors: {stats['total_vectors']}")
    print(f"Index status: {stats['status']}")
    print(f"Dimension: {stats['dimension']}")

if __name__ == "__main__":
    asyncio.run(check_stats())
```

### Test RAG Search

```python
# backend/scripts/test_search.py
import asyncio
from app.services.rag_service import rag_service

async def test_search():
    query = "What are the symptoms of diabetes?"
    results = await rag_service.search(query, top_k=5)
    
    print(f"\nFound {len(results)} results for: {query}\n")
    for i, doc in enumerate(results, 1):
        print(f"{i}. Score: {doc['score']:.3f}")
        print(f"   Content: {doc['content'][:200]}...")
        print()

if __name__ == "__main__":
    asyncio.run(test_search())
```

## Data Maintenance

### Update Documents

```python
# Update existing document
await rag_service.upsert_documents([{
    "id": "doc1",  # Same ID will update
    "content": "Updated content...",
    "source": "update",
    "metadata": {"updated": "2024-01-01"}
}])
```

### Delete Documents

```python
# Delete by IDs
await rag_service.delete_documents(["doc1", "doc2", "doc3"])
```

### Clear All Data

```python
# WARNING: This deletes everything!
# Delete index in Pinecone dashboard and recreate
```

## Performance Tips

1. **Embedding Caching**: Cache embeddings for frequently accessed documents
2. **Batch Operations**: Always batch upload/delete operations
3. **Metadata Filtering**: Use metadata filters to narrow search scope
4. **Regular Updates**: Refresh data monthly with latest research
5. **Monitor Costs**: Track Pinecone usage and OpenAI API calls

## Dataset Sources

- PubMed: https://pubmed.ncbi.nlm.nih.gov/
- PubMedQA: https://pubmedqa.github.io/
- MedQA: https://github.com/jind11/MedQA
- MIMIC: https://mimic.mit.edu/
- BioASQ: http://bioasq.org/
- Medical Transcriptions: https://www.mtsamples.com/

## Legal & Ethical Considerations

- ✅ Ensure data usage complies with licensing terms
- ✅ De-identify any patient information (HIPAA compliance)
- ✅ Cite sources appropriately
- ✅ Respect copyright and usage restrictions
- ✅ Regular quality audits of loaded data

## Next Steps

1. Load sample data for testing
2. Gradually add domain-specific datasets
3. Monitor search quality and relevance
4. Iterate on metadata and chunking strategies
5. Set up automated data refresh pipelines
