import axios from "axios";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/**
 * Get headers for OpenRouter API requests
 */
function getHeaders() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured in environment");
  }
  
  return {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
    "X-Title": "Cura AI Medical Assistant",
    "Content-Type": "application/json"
  };
}

/**
 * Call OpenRouter chat completion endpoint (non-streaming)
 * @param {Object} options - Request options
 * @param {string} options.model - Model ID (e.g., "google/gemini-2.0-flash-exp:free")
 * @param {Array} options.messages - Chat messages array
 * @param {number} options.temperature - Temperature (0-1)
 * @param {number} options.maxTokens - Maximum tokens to generate
 * @returns {Promise<Object>} - OpenRouter response
 */
export async function callOpenRouterModel({ 
  model, 
  messages, 
  temperature = 0.2, 
  maxTokens = 800 
}) {
  const url = `${OPENROUTER_BASE}/chat/completions`;
  
  const body = {
    model: model || process.env.OPENROUTER_DEFAULT_MODEL || "google/gemini-2.0-flash-exp:free",
    messages,
    temperature,
    max_tokens: maxTokens
  };
  
  try {
    const response = await axios.post(url, body, { 
      headers: getHeaders(),
      timeout: parseInt(process.env.REQUEST_TIMEOUT || "30000", 10)
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // OpenRouter returned an error
      throw new Error(`OpenRouter API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // Request was made but no response
      throw new Error(`OpenRouter API timeout or network error`);
    } else {
      throw error;
    }
  }
}

/**
 * Call OpenRouter with streaming support
 * @param {Object} options - Request options
 * @param {string} options.model - Model ID
 * @param {Array} options.messages - Chat messages array
 * @param {Function} options.onToken - Callback for each token (optional)
 * @returns {Promise<string>} - Complete response text
 */
export async function callOpenRouterStreaming({ 
  model, 
  messages, 
  temperature = 0.2, 
  maxTokens = 800,
  onToken
}) {
  const url = `${OPENROUTER_BASE}/chat/completions`;
  
  const body = {
    model: model || process.env.OPENROUTER_STREAMING_MODEL || "google/gemini-2.0-flash-exp:free",
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true
  };
  
  try {
    const response = await axios.post(url, body, { 
      headers: getHeaders(),
      responseType: "stream",
      timeout: parseInt(process.env.REQUEST_TIMEOUT || "30000", 10)
    });
    
    let fullText = "";
    
    return new Promise((resolve, reject) => {
      response.data.on("data", (chunk) => {
        const lines = chunk.toString().split("\n").filter(line => line.trim() !== "");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            
            if (data === "[DONE]") {
              resolve(fullText);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullText += content;
                if (onToken) {
                  onToken(content);
                }
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      });
      
      response.data.on("end", () => {
        resolve(fullText);
      });
      
      response.data.on("error", (error) => {
        reject(new Error(`Stream error: ${error.message}`));
      });
    });
  } catch (error) {
    if (error.response) {
      throw new Error(`OpenRouter streaming error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error(`OpenRouter streaming timeout or network error`);
    } else {
      throw error;
    }
  }
}

/**
 * Forward streaming response to WebSocket client
 * @param {Object} options - Request options
 * @param {string} options.prompt - User prompt
 * @param {WebSocket} options.socket - WebSocket connection
 * @param {string} options.model - Model ID (optional)
 */
export async function forwardToOpenRouterStreaming({ prompt, socket, model }) {
  const messages = [
    {
      role: "system",
      content: "You are Cura AI, a calm and helpful medical assistant for emergency first-aid guidance. Provide clear, step-by-step instructions. Never diagnose conditions. Always recommend calling emergency services when appropriate."
    },
    {
      role: "user",
      content: prompt
    }
  ];
  
  try {
    await callOpenRouterStreaming({
      model: model || process.env.OPENROUTER_STREAMING_MODEL,
      messages,
      onToken: (token) => {
        if (socket.readyState === 1) { // WebSocket.OPEN
          socket.send(JSON.stringify({ 
            type: "llm_token", 
            content: token 
          }));
        }
      }
    });
    
    // Send completion signal
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({ 
        type: "llm_complete" 
      }));
    }
  } catch (error) {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({ 
        type: "error", 
        message: error.message 
      }));
    }
    throw error;
  }
}

/**
 * Get list of available models from OpenRouter
 * @returns {Promise<Array>} - Array of model objects
 */
export async function getAvailableModels() {
  const url = `${OPENROUTER_BASE}/models`;
  
  try {
    const response = await axios.get(url, { headers: getHeaders() });
    return response.data.data || [];
  } catch (error) {
    throw new Error(`Failed to fetch models: ${error.message}`);
  }
}
