/**
 * Session Manager
 * Handles session state with Redis
 */

import { createClient } from 'redis';
import { config } from '../config.js';
import { logger } from '../logger.js';

export class SessionManager {
  constructor() {
    this.client = null;
  }
  
  async connect() {
    try {
      this.client = createClient({ url: config.REDIS_URL });
      
      this.client.on('error', (err) => {
        logger.error('Redis Client Error', { error: err.message });
      });
      
      await this.client.connect();
      logger.info('Connected to Redis');
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      // Use in-memory fallback
      this.client = new Map();
      logger.warn('Using in-memory session storage (fallback)');
    }
  }
  
  async getSession(sessionId) {
    try {
      if (this.client instanceof Map) {
        return this.client.get(sessionId);
      }
      
      const data = await this.client.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get session', { sessionId, error: error.message });
      return null;
    }
  }
  
  async setSession(sessionId, data, ttl = 86400) {
    try {
      if (this.client instanceof Map) {
        this.client.set(sessionId, data);
        return true;
      }
      
      await this.client.setEx(
        `session:${sessionId}`,
        ttl,
        JSON.stringify(data)
      );
      return true;
    } catch (error) {
      logger.error('Failed to set session', { sessionId, error: error.message });
      return false;
    }
  }
  
  async updateSession(sessionId, updates) {
    const session = await this.getSession(sessionId);
    if (!session) return false;
    
    const updated = { ...session, ...updates, lastActive: Date.now() };
    return await this.setSession(sessionId, updated);
  }
  
  async addMessage(sessionId, role, content, metadata = {}) {
    const session = await this.getSession(sessionId);
    if (!session) return false;
    
    if (!session.messages) session.messages = [];
    
    session.messages.push({
      role,
      content,
      timestamp: Date.now(),
      ...metadata
    });
    
    // Keep last 50 messages
    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-50);
    }
    
    return await this.setSession(sessionId, session);
  }
  
  async getMessages(sessionId, limit = 10) {
    const session = await this.getSession(sessionId);
    if (!session || !session.messages) return [];
    
    return session.messages.slice(-limit);
  }
}

export default SessionManager;
