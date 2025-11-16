/**
 * Real-time session control endpoints
 * These work alongside the WebSocket /ws/realtime connection
 */
export default async function (fastify, opts) {
  
  /**
   * Start a real-time session
   * POST /api/realtime/start
   * Body: { sessionId?: string, language?: string }
   */
  fastify.post("/start", async (request, reply) => {
    const { sessionId, language } = request.body || {};
    
    const session = {
      sessionId: sessionId || `rt-${Date.now()}`,
      language: language || "en",
      startedAt: new Date().toISOString(),
      status: "active"
    };
    
    fastify.log.info({ session }, "Real-time session started");
    
    return { 
      success: true, 
      message: "Real-time session started. Connect to WebSocket at /ws/realtime",
      session,
      websocketUrl: `ws://localhost:${process.env.PORT || 3000}/ws/realtime`
    };
  });
  
  /**
   * Stop a real-time session
   * POST /api/realtime/stop
   * Body: { sessionId: string }
   */
  fastify.post("/stop", async (request, reply) => {
    const { sessionId } = request.body || {};
    
    if (!sessionId) {
      return reply.code(400).send({ 
        error: "Bad Request", 
        message: "sessionId is required" 
      });
    }
    
    fastify.log.info({ sessionId }, "Real-time session stopped");
    
    return { 
      success: true, 
      message: "Real-time session stopped",
      sessionId,
      stoppedAt: new Date().toISOString()
    };
  });
  
  /**
   * Get session status
   * GET /api/realtime/status/:sessionId
   */
  fastify.get("/status/:sessionId", async (request, reply) => {
    const { sessionId } = request.params;
    
    // This would query actual session storage
    return {
      success: true,
      sessionId,
      status: "active",
      message: "Session status endpoint - implement session storage query"
    };
  });
}
