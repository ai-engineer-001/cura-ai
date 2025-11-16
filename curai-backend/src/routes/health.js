/**
 * Health check endpoint
 * Returns server status and timestamp
 */
export default async function (fastify, opts) {
  fastify.get("/", async (request, reply) => {
    return {
      ok: true,
      status: "healthy",
      time: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: {
        node: process.version,
        platform: process.platform,
        pineconeConfigured: !!process.env.PINECONE_API_KEY,
        openrouterConfigured: !!process.env.OPENROUTER_API_KEY
      }
    };
  });
}
