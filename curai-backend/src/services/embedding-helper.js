/**
 * Embedding helper service
 * Abstracts embedding generation to allow swapping between providers
 */

import axios from "axios";

/**
 * Generate embedding using configured provider
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - Embedding vector
 */
export async function embedText(text) {
  const provider = process.env.EMBEDDING_PROVIDER || "openai";
  
  switch (provider) {
    case "openai":
      return await embedWithOpenAI(text);
    case "voyage":
      return await embedWithVoyage(text);
    case "local":
      return await embedWithLocal(text);
    default:
      throw new Error(`Unknown embedding provider: ${provider}`);
  }
}

/**
 * Batch generate embeddings
 * @param {Array<string>} texts - Array of texts
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
export async function embedTexts(texts) {
  const provider = process.env.EMBEDDING_PROVIDER || "openai";
  const batchSize = parseInt(process.env.EMBED_BATCH_SIZE || "50", 10);
  
  const results = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    switch (provider) {
      case "openai":
        const openaiEmbeds = await batchEmbedWithOpenAI(batch);
        results.push(...openaiEmbeds);
        break;
      case "voyage":
        const voyageEmbeds = await batchEmbedWithVoyage(batch);
        results.push(...voyageEmbeds);
        break;
      case "local":
        const localEmbeds = await Promise.all(batch.map(embedWithLocal));
        results.push(...localEmbeds);
        break;
      default:
        throw new Error(`Unknown embedding provider: ${provider}`);
    }
  }
  
  return results;
}

/**
 * OpenAI embeddings via OpenRouter
 */
async function embedWithOpenAI(text) {
  const model = process.env.OPENROUTER_EMBED_MODEL || "text-embedding-3-small";
  
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }
  
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/embeddings",
      {
        model: model,
        input: text
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "Cura AI Medical Assistant",
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );
    
    return response.data.data[0].embedding;
  } catch (error) {
    if (error.response) {
      throw new Error(`OpenAI embedding error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`OpenAI embedding failed: ${error.message}`);
  }
}

/**
 * Batch OpenAI embeddings
 */
async function batchEmbedWithOpenAI(texts) {
  const model = process.env.OPENROUTER_EMBED_MODEL || "text-embedding-3-small";
  
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }
  
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/embeddings",
      {
        model: model,
        input: texts // OpenAI supports batch input
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "Cura AI Medical Assistant",
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );
    
    return response.data.data.map(item => item.embedding);
  } catch (error) {
    if (error.response) {
      throw new Error(`OpenAI batch embedding error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`OpenAI batch embedding failed: ${error.message}`);
  }
}

/**
 * Voyage AI embeddings
 */
async function embedWithVoyage(text) {
  const model = process.env.VOYAGE_MODEL || "voyage-large-2-instruct";
  
  if (!process.env.VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY not configured");
  }
  
  try {
    const response = await axios.post(
      "https://api.voyageai.com/v1/embeddings",
      {
        model: model,
        input: text,
        input_type: "document"
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.VOYAGE_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );
    
    return response.data.data[0].embedding;
  } catch (error) {
    throw new Error(`Voyage embedding failed: ${error.message}`);
  }
}

/**
 * Batch Voyage AI embeddings
 */
async function batchEmbedWithVoyage(texts) {
  const model = process.env.VOYAGE_MODEL || "voyage-large-2-instruct";
  
  if (!process.env.VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY not configured");
  }
  
  try {
    const response = await axios.post(
      "https://api.voyageai.com/v1/embeddings",
      {
        model: model,
        input: texts,
        input_type: "document"
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.VOYAGE_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );
    
    return response.data.data.map(item => item.embedding);
  } catch (error) {
    throw new Error(`Voyage batch embedding failed: ${error.message}`);
  }
}

/**
 * Local embedding (placeholder for sentence-transformers or similar)
 */
async function embedWithLocal(text) {
  // This would require a local embedding service running
  // For now, throw an error directing users to configure it
  throw new Error("Local embedding not yet implemented. Use EMBEDDING_PROVIDER=openai or EMBEDDING_PROVIDER=voyage");
}

/**
 * Get embedding dimension for configured model
 * @returns {number} - Embedding dimension
 */
export function getEmbeddingDimension() {
  const provider = process.env.EMBEDDING_PROVIDER || "openai";
  const model = process.env.OPENROUTER_EMBED_MODEL || "text-embedding-3-small";
  
  // Common embedding dimensions
  const dimensions = {
    "text-embedding-3-small": 1536,
    "text-embedding-3-large": 3072,
    "text-embedding-ada-002": 1536,
    "voyage-large-2-instruct": 1024,
    "voyage-2": 1024
  };
  
  return dimensions[model] || 1536; // Default to 1536
}
