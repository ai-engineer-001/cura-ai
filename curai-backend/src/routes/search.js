import { runRag } from "../services/rag.js";
import { handleEmergencyQuery, isEmergencyQuery } from "../services/emergency-response.js";

/**
 * Search and RAG endpoints
 * POST /api/search - Execute RAG pipeline with query
 */
export default async function (fastify, opts) {
  
  /**
   * Execute RAG pipeline
   * Body: { query: string, sessionId?: string, topK?: number }
   */
  fastify.post("/", async (request, reply) => {
    const { query, sessionId, topK } = request.body;
    
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return reply.code(400).send({ 
        error: "Bad Request", 
        message: "query string is required" 
      });
    }
    
    const trimmedQuery = query.trim();
    const emergency = request.emergency || isEmergencyQuery(trimmedQuery) || null;
    
    if (emergency?.detected) {
      fastify.log.warn({ 
        query: trimmedQuery.substring(0, 100), 
        emergency 
      }, "Emergency query detected");
      const emergencyResult = await handleEmergencyQuery({
        query: trimmedQuery,
        sessionId: sessionId || `session-${Date.now()}`,
        detection: emergency
      });
      return {
        success: true,
        ...emergencyResult
      };
    }
    
    try {
      fastify.log.info({ 
        query: trimmedQuery.substring(0, 100), 
        sessionId, 
        emergency 
      }, "Starting RAG pipeline");
      
      const result = await runRag({ 
        query: trimmedQuery, 
        sessionId: sessionId || `session-${Date.now()}`, 
        emergency: false,
        topK: topK || 5
      });
      
      fastify.log.info({ 
        sessionId: result.sessionId,
        sourceCount: result.sources?.length || 0
      }, "RAG pipeline completed");
      
      return { 
        success: true, 
        ...result 
      };
    } catch (error) {
      fastify.log.error({ error, query: query.substring(0, 100) }, "RAG pipeline failed");
      
      return reply.code(500).send({
        error: "Search Failed",
        message: error.message || "Failed to execute RAG pipeline"
      });
    }
  });
  
  /**
   * Verify medical response with high-capacity model
   * POST /api/search/verify
   */
  fastify.post("/verify", async (request, reply) => {
    const { response, context, query } = request.body;
    
    if (!response || !query) {
      return reply.code(400).send({ 
        error: "Bad Request", 
        message: "response and query are required" 
      });
    }
    
    try {
      fastify.log.info({ query: query.substring(0, 100) }, "Starting medical verification");
      
      // This would call the high-capacity verification model
      // For now, return a placeholder
      return {
        success: true,
        verified: true,
        confidence: 0.95,
        warnings: [],
        message: "Verification endpoint - implement high-capacity model check"
      };
    } catch (error) {
      fastify.log.error({ error }, "Verification failed");
      
      return reply.code(500).send({
        error: "Verification Failed",
        message: error.message
      });
    }
  });
}
