import axios from "axios";

// Pinecone REST API base URL
const getPineconeUrl = () => {
  // If PINECONE_HOST is set directly, use it
  const host = process.env.PINECONE_HOST;
  if (host) {
    return `https://${host}`;
  }
  
  // Otherwise build from index name and environment
  const indexName = process.env.PINECONE_INDEX_NAME;
  const environment = process.env.PINECONE_ENVIRONMENT;
  
  if (!indexName || !environment) {
    throw new Error("PINECONE_HOST or (PINECONE_INDEX_NAME and PINECONE_ENVIRONMENT) must be configured");
  }
  
  return `https://${indexName}-${environment}.svc.pinecone.io`;
};

/**
 * Get headers for Pinecone API requests
 */
function getHeaders() {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY not configured in environment");
  }
  
  return {
    "Api-Key": apiKey,
    "Content-Type": "application/json"
  };
}

/**
 * Batch embed texts and upsert vectors to Pinecone
 * @param {Array} items - Array of {id, text, metadata?} objects
 * @returns {Promise<Object>} - Upsert response from Pinecone
 */
export async function batchEmbedAndUpsert(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items must be a non-empty array");
  }
  
  // Generate embeddings for all items
  const embeddings = await Promise.all(
    items.map(async (item) => {
      const embedding = await generateEmbedding(item.text);
      return {
        id: item.id,
        values: embedding,
        metadata: {
          text: item.text,
          ...item.metadata
        }
      };
    })
  );
  
  // Upsert to Pinecone
  return await upsertVectors(embeddings);
}

/**
 * Upsert vectors to Pinecone index
 * @param {Array} vectors - Array of {id, values, metadata} objects
 * @param {string} namespace - Namespace (default: "curai")
 * @returns {Promise<Object>} - Pinecone response
 */
export async function upsertVectors(vectors, namespace = "curai") {
  const url = `${getPineconeUrl()}/vectors/upsert`;
  
  const body = {
    vectors,
    namespace
  };
  
  try {
    const response = await axios.post(url, body, { 
      headers: getHeaders(),
      timeout: 30000
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Pinecone upsert error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error(`Pinecone upsert timeout or network error`);
    } else {
      throw error;
    }
  }
}

/**
 * Query vectors from Pinecone index
 * @param {Array} queryVector - Query embedding vector
 * @param {number} topK - Number of results to return
 * @param {string} namespace - Namespace (default: "" for default namespace)
 * @param {Object} filter - Metadata filter (optional)
 * @returns {Promise<Object>} - Pinecone query response
 */
export async function queryVector(queryVector, topK = 5, namespace = "", filter = null) {
  const url = `${getPineconeUrl()}/query`;
  
  const body = {
    vector: queryVector,
    topK,
    includeMetadata: true,
    includeValues: false
  };
  
  // Only add namespace if it's explicitly set
  if (namespace) {
    body.namespace = namespace;
  }
  
  if (filter) {
    body.filter = filter;
  }
  
  try {
    const response = await axios.post(url, body, { 
      headers: getHeaders(),
      timeout: 15000
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Pinecone query error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error(`Pinecone query timeout or network error`);
    } else {
      throw error;
    }
  }
}

/**
 * Get index statistics
 * @returns {Promise<Object>} - Index stats
 */
export async function getIndexStats() {
  const url = `${getPineconeUrl()}/describe_index_stats`;
  
  try {
    const response = await axios.post(url, {}, { 
      headers: getHeaders(),
      timeout: 10000
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get index stats: ${error.message}`);
  }
}

/**
 * Generate embedding for a single text
 * This is a placeholder - implement with your chosen embedding model
 * Options:
 * 1. Call OpenRouter embedding endpoint
 * 2. Use OpenAI embeddings directly
 * 3. Use local embedding model
 * 
 * @param {string} text - Text to embed
 * @returns {Promise<Array>} - Embedding vector (e.g., 1536 dimensions)
 */
async function generateEmbedding(text) {
  // TODO: Implement actual embedding generation
  // For now, return a mock embedding
  
  // Example for OpenAI text-embedding-3-small (1536 dimensions)
  // This should be replaced with actual API call
  
  if (process.env.MOCK_MODE === "true") {
    // Generate random embedding for testing
    const dimension = 1536; // text-embedding-3-small dimension
    return new Array(dimension).fill(0).map(() => Math.random() * 0.002 - 0.001);
  }
  
  // TODO: Implement real embedding call
  // Example using OpenRouter:
  // const embedModel = process.env.OPENROUTER_EMBED_MODEL || "text-embedding-3-small";
  // const response = await axios.post(
  //   "https://openrouter.ai/api/v1/embeddings",
  //   { model: embedModel, input: text },
  //   { headers: getOpenRouterHeaders() }
  // );
  // return response.data.data[0].embedding;
  
  throw new Error("Embedding generation not yet implemented. Set MOCK_MODE=true for testing or implement embedding service.");
}

/**
 * Batch generate embeddings
 * @param {Array<string>} texts - Array of texts to embed
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
export async function batchGenerateEmbeddings(texts) {
  // For production, batch API calls for efficiency
  const batchSize = parseInt(process.env.EMBED_BATCH_SIZE || "50", 10);
  const results = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await Promise.all(batch.map(text => generateEmbedding(text)));
    results.push(...embeddings);
  }
  
  return results;
}
