import { batchEmbedAndUpsert } from "../services/pinecone.js";

/**
 * Embedding and indexing endpoints
 * POST /api/embed/batch - Batch embed and upsert documents to Pinecone
 */
export default async function (fastify, opts) {
  
  /**
   * Batch embed and upsert documents
   * Body: { items: [{id: string, text: string, metadata?: object}] }
   */
  fastify.post("/batch", async (request, reply) => {
    const { items } = request.body;
    
    if (!Array.isArray(items)) {
      return reply.code(400).send({ 
        error: "Bad Request", 
        message: "items array required with format [{id, text, metadata?}]" 
      });
    }
    
    if (items.length === 0) {
      return reply.code(400).send({ 
        error: "Bad Request", 
        message: "items array cannot be empty" 
      });
    }
    
    // Validate item structure
    const invalidItems = items.filter(item => !item.id || !item.text);
    if (invalidItems.length > 0) {
      return reply.code(400).send({ 
        error: "Bad Request", 
        message: "All items must have 'id' and 'text' properties",
        invalidItems: invalidItems.slice(0, 5) // Show first 5 invalid items
      });
    }
    
    try {
      fastify.log.info({ itemCount: items.length }, "Starting batch embed and upsert");
      
      const result = await batchEmbedAndUpsert(items);
      
      fastify.log.info({ result }, "Batch embed and upsert completed");
      
      return { 
        success: true, 
        itemsProcessed: items.length,
        result 
      };
    } catch (error) {
      fastify.log.error({ error }, "Failed to batch embed and upsert");
      
      return reply.code(500).send({
        error: "Embedding Failed",
        message: error.message || "Failed to generate embeddings and upsert to Pinecone"
      });
    }
  });
  
  /**
   * Get embedding statistics
   * GET /api/embed/stats
   */
  fastify.get("/stats", async (request, reply) => {
    try {
      const axios = (await import('axios')).default;
      
      // Get Pinecone index host
      const listResp = await axios.get('https://api.pinecone.io/indexes', {
        headers: { 'Api-Key': process.env.PINECONE_API_KEY }
      });
      
      const indexes = listResp.data?.indexes || listResp.data || [];
      const index = indexes.find(i => i.name === process.env.PINECONE_INDEX_NAME);
      
      if (!index) {
        return reply.code(404).send({
          success: false,
          error: "Index not found",
          message: `Pinecone index "${process.env.PINECONE_INDEX_NAME}" not found`
        });
      }
      
      const host = index.host;
      
      // Get index stats
      const statsResp = await axios.post(
        `https://${host}/describe_index_stats`,
        {},
        {
          headers: {
            'Api-Key': process.env.PINECONE_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const stats = statsResp.data;
      const vectorCount = stats.totalRecordCount || stats.total_vector_count || 0;
      
      return {
        success: true,
        indexName: process.env.PINECONE_INDEX_NAME,
        vectorCount,
        dimension: stats.dimension,
        namespaces: stats.namespaces ? Object.keys(stats.namespaces).length : 0,
        host
      };
    } catch (error) {
      fastify.log.error({ error }, "Failed to get Pinecone stats");
      return reply.code(500).send({
        success: false,
        error: "Stats Failed",
        message: error.message
      });
    }
  });
}

