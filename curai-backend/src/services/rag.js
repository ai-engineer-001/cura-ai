import { queryVector } from "./pinecone.js";
import { callOpenRouterModel } from "./openrouter.js";
import { embedText } from "./embedding-helper.js";

// Relevance score thresholds for hybrid fallback
const THRESHOLD_HIGH_CONFIDENCE = parseFloat(process.env.RAG_THRESHOLD_HIGH || "0.80");
const THRESHOLD_PARTIAL_CONFIDENCE = parseFloat(process.env.RAG_THRESHOLD_PARTIAL || "0.70");
const THRESHOLD_FALLBACK = parseFloat(process.env.RAG_THRESHOLD_FALLBACK || "0.60");

/**
 * Run complete RAG pipeline with hybrid fallback strategy
 * @param {Object} options - Pipeline options
 * @param {string} options.query - User query
 * @param {string} options.sessionId - Session identifier
 * @param {boolean} options.emergency - Emergency flag
 * @param {number} options.topK - Number of documents to retrieve
 * @returns {Promise<Object>} - RAG result with sources and response
 */
export async function runRag({ query, sessionId, emergency = false, topK = 5 }) {
  console.log(`[RAG] Starting pipeline for session ${sessionId}`);
  
  // Step 1: Generate query embedding
  console.log(`[RAG] Generating query embedding...`);
  const queryEmbedding = await embedText(query);
  
  // Step 2: Initial dense retrieval from Pinecone
  console.log(`[RAG] Retrieving top ${topK} documents from Pinecone...`);
  const retrievalTopK = process.env.RAG_RERANK_ENABLED === "true" ? topK * 2 : topK;
  let pineconeResult = await queryVector(queryEmbedding, retrievalTopK);
  
  // Step 2a: Check if we need expanded retrieval (no results or low scores)
  const topScore = pineconeResult.matches?.[0]?.score || 0;
  
  if (!pineconeResult.matches || pineconeResult.matches.length === 0) {
    console.log(`[RAG] No matches found - attempting expanded retrieval with higher topK`);
    pineconeResult = await queryVector(queryEmbedding, retrievalTopK * 3);
  } else if (topScore < THRESHOLD_FALLBACK) {
    console.log(`[RAG] Low confidence (${topScore.toFixed(3)}) - attempting expanded retrieval`);
    pineconeResult = await queryVector(queryEmbedding, retrievalTopK * 2);
  }
  
  // Recalculate top score after potential expansion
  const finalTopScore = pineconeResult.matches?.[0]?.score || 0;
  
  // Step 2b: Determine retrieval quality and response strategy
  if (!pineconeResult.matches || pineconeResult.matches.length === 0) {
    console.log(`[RAG] No matches found even with expanded retrieval - full fallback to LLM`);
    return await generateFallbackResponse(query, sessionId, emergency, 'no_retrieval');
  }
  
  if (finalTopScore < THRESHOLD_FALLBACK) {
    console.log(`[RAG] Very low confidence (${finalTopScore.toFixed(3)}) - fallback to LLM with minimal context`);
    return await generateFallbackResponse(query, sessionId, emergency, 'low_confidence', pineconeResult.matches.slice(0, 2));
  }
  
  // Step 3: Extract candidates
  let candidates = pineconeResult.matches.map(match => ({
    id: match.id,
    score: match.score,
    text: buildTextFromMetadata(match.metadata),
    metadata: match.metadata || {}
  }));
  
  console.log(`[RAG] Retrieved ${candidates.length} candidates, top score: ${finalTopScore.toFixed(3)}`);
  
  // Step 4: Reranking (optional)
  if (process.env.RAG_RERANK_ENABLED === "true") {
    console.log(`[RAG] Reranking candidates...`);
    candidates = await rerankCandidates(query, candidates, topK);
  }
  
  // Step 5: Build context from top candidates
  const finalTopK = parseInt(process.env.RAG_RERANK_TOP_K || "3", 10);
  const topCandidates = candidates.slice(0, finalTopK);
  
  // Determine confidence level based on top score
  let confidenceLevel = 'high';
  let responseLabel = 'grounded';
  
  if (finalTopScore >= THRESHOLD_HIGH_CONFIDENCE) {
    confidenceLevel = 'high';
    responseLabel = 'grounded';
    console.log(`[RAG] High confidence retrieval (${finalTopScore.toFixed(3)}) - generating grounded response`);
  } else if (finalTopScore >= THRESHOLD_PARTIAL_CONFIDENCE) {
    confidenceLevel = 'partial';
    responseLabel = 'partially_grounded';
    console.log(`[RAG] Partial confidence (${finalTopScore.toFixed(3)}) - generating partially grounded response`);
  } else {
    confidenceLevel = 'low';
    responseLabel = 'low_grounded';
    console.log(`[RAG] Low confidence (${finalTopScore.toFixed(3)}) - supplementing with model knowledge`);
  }
  
  const context = topCandidates
    .map((c, idx) => `[Source ${idx + 1}] (relevance: ${c.score.toFixed(3)})\n${c.text}`)
    .join("\n\n");
  
  console.log(`[RAG] Using ${topCandidates.length} sources for context`);
  
  // Step 6: Build prompts based on confidence level
  const systemPrompt = buildSystemPrompt(emergency, true, confidenceLevel);
  const userPrompt = buildUserPrompt(query, context, confidenceLevel, emergency);

  // Step 7: Generate response using LLM
  console.log(`[RAG] Generating ${confidenceLevel}-confidence response with ${emergency ? "EMERGENCY" : "DEFAULT"} model...`);
  const model = emergency 
    ? process.env.OPENROUTER_MEDICAL_MODEL 
    : process.env.OPENROUTER_DEFAULT_MODEL;
  
  const llmResponse = await callOpenRouterModel({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: emergency ? 0.1 : (confidenceLevel === 'high' ? 0.2 : 0.4),
    maxTokens: emergency ? 1500 : 1000
  });
  
  const responseText = llmResponse.choices?.[0]?.message?.content || "Unable to generate response";
  
  // Log for dataset improvement
  logRAGEvent({
    sessionId,
    query,
    topScore: finalTopScore,
    confidenceLevel,
    responseLabel,
    sourcesUsed: topCandidates.length,
    emergency
  });
  
  console.log(`[RAG] Pipeline complete - ${responseLabel}`);
  
  return {
    sessionId,
    query,
    sources: topCandidates.map(c => ({
      id: c.id,
      score: c.score,
      text: c.text.substring(0, 200) + (c.text.length > 200 ? "..." : ""),
      metadata: c.metadata
    })),
    response: responseText,
    emergency: emergency,
    confidenceLevel,
    responseLabel,
    topScore: finalTopScore,
    model: model,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate fallback response when retrieval fails or has very low confidence
 */
async function generateFallbackResponse(query, sessionId, emergency, fallbackReason, weakSources = []) {
  console.log(`[RAG] Generating fallback response - reason: ${fallbackReason}`);
  
  const systemPrompt = buildFallbackSystemPrompt(emergency);
  const userPrompt = buildFallbackUserPrompt(query, emergency, weakSources);
  
  const model = emergency 
    ? process.env.OPENROUTER_MEDICAL_MODEL 
    : process.env.OPENROUTER_DEFAULT_MODEL;
  
  const llmResponse = await callOpenRouterModel({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: emergency ? 0.1 : 0.4,
    maxTokens: emergency ? 1500 : 1000
  });
  
  const responseText = llmResponse.choices?.[0]?.message?.content || "Unable to generate response";
  
  // Log fallback event for dataset improvement
  logRAGEvent({
    sessionId,
    query,
    topScore: weakSources[0]?.score || 0,
    confidenceLevel: 'fallback',
    responseLabel: 'model_fallback',
    sourcesUsed: weakSources.length,
    emergency,
    fallbackReason
  });
  
  return {
    sessionId,
    query,
    sources: weakSources.slice(0, 2).map(match => ({
      id: match.id,
      score: match.score,
      text: buildTextFromMetadata(match.metadata).substring(0, 200) + "...",
      metadata: match.metadata
    })),
    response: responseText,
    emergency: emergency,
    confidenceLevel: 'fallback',
    responseLabel: 'model_fallback',
    topScore: weakSources[0]?.score || 0,
    fallback: true,
    fallbackReason,
    warning: "⚠️ Model-based response — not source-backed. Retrieved sources had low relevance. Please consult a healthcare professional for definitive guidance.",
    model: model,
    timestamp: new Date().toISOString()
  };
}

/**
 * Build system prompt with safety instructions
 */
function buildSystemPrompt(emergency, hasContext = true, confidenceLevel = 'high') {
  const contextGuidance = {
    high: "Use the provided medical knowledge context as your primary source. The sources are highly relevant.",
    partial: "Use the provided medical knowledge context where applicable, but supplement with your medical knowledge as the sources may not be perfectly matched.",
    low: "The provided sources have low relevance. Primarily use your medical knowledge, but reference sources if they contain useful information."
  };
  
  const guidance = hasContext ? contextGuidance[confidenceLevel] : "Use your medical knowledge to provide accurate, evidence-based information";
    
  const basePrompt = `You are Cura AI, a careful medical first-aid guidance assistant.

CRITICAL SAFETY RULES:
1. NEVER provide definitive diagnoses (instead say "likely" or "possible")
2. NEVER prescribe medications or specific dosages
3. ALWAYS recommend calling emergency services (911/112/108) for serious situations
4. ${guidance}
5. If uncertain, state your uncertainty level clearly

Your role is to:
- Provide clear, evidence-based first-aid guidance
- Explain key clinical findings that support your assessment
- List specific diagnostic tests that would confirm suspicions
- Recommend immediate next-steps (urgent care, ER, specialist consult)
- Keep instructions simple and actionable
- Prioritize safety above all else`;

  if (emergency) {
    return `${basePrompt}

⚠️ EMERGENCY MODE ACTIVE ⚠️
This is a critical emergency situation. Your response must:
1. Start with "🚨 CALL EMERGENCY SERVICES IMMEDIATELY (911/112/108)"
2. Provide immediate life-saving actions (CPR, stop bleeding, etc.)
3. Keep instructions extremely clear and brief
4. Focus only on the most critical immediate actions
5. Avoid any non-essential information`;
  }
  
  return basePrompt;
}

/**
 * Build fallback system prompt for when retrieval fails
 */
function buildFallbackSystemPrompt(emergency) {
  const basePrompt = `You are a careful, conservative medical assistant. The retrieval step returned no supporting documents or very low-relevance results; answer from your medical knowledge.

CRITICAL INSTRUCTIONS:
1. Clearly label this as "Model-based — not source-backed"
2. State the most likely diagnosis/condition and confidence level (High / Moderate / Low)
3. Explain 3 key findings from the question that support your assessment
4. List 3 specific diagnostic tests that would confirm the diagnosis
5. Recommend immediate next-steps for caregivers (urgent clinic, ER, specialist)
6. Include explicit safety disclaimer: "This is not a definitive diagnosis; consult a clinician."
7. Do NOT provide step-by-step self-treatment instructions
8. Do NOT assert certainty where medical complexity exists`;

  if (emergency) {
    return `${basePrompt}

⚠️ EMERGENCY SITUATION ⚠️
- Immediately recommend calling emergency services
- Provide only critical immediate actions
- Avoid detailed explanations - focus on life-saving steps`;
  }
  
  return basePrompt;
}

/**
 * Build user prompt based on confidence level
 */
function buildUserPrompt(query, context, confidenceLevel, emergency) {
  const instructions = {
    high: `- Use the provided sources as your primary reference (they are highly relevant)
- Cite specific findings from the sources to support your answer
- If sources conflict, highlight the contradiction`,
    partial: `- Use the provided sources where applicable, but they may not fully answer the question
- Supplement with your medical knowledge where sources are insufficient
- Clearly distinguish between source-backed and supplemental information`,
    low: `- The provided sources have limited relevance to this query
- Primarily use your medical knowledge to answer
- Reference sources only if they contain genuinely useful information
- Be explicit about the low source relevance`
  };
  
  const emergencyNote = emergency ? "\n- This is an EMERGENCY - prioritize immediate life-saving actions first" : "";
  
  return `Medical Knowledge Context:
${context}

User Question: ${query}

Instructions:
${instructions[confidenceLevel]}
- Provide clear, actionable guidance
- State confidence level if relevant${emergencyNote}

Answer:`;
}

/**
 * Build fallback user prompt when retrieval fails
 */
function buildFallbackUserPrompt(query, emergency, weakSources = []) {
  const sourcesNote = weakSources.length > 0 
    ? `\n\nNote: Retrieval returned ${weakSources.length} sources with very low relevance scores (< 0.60). You may reference them if genuinely useful, but primarily rely on your medical knowledge.`
    : "\n\nNote: No sources were retrieved from the knowledge base.";
  
  const emergencyInstructions = emergency 
    ? "\n\n⚠️ EMERGENCY: Recommend calling 911/112/108 immediately. Provide only critical immediate actions."
    : "";
  
  return `Question: ${query}${sourcesNote}${emergencyInstructions}

Provide a careful, model-based answer following the format:

**Model-based — not source-backed** (Confidence: [High/Moderate/Low])

**Assessment:**
[Most likely diagnosis/condition and brief rationale]

**Key Supporting Findings:**
1. [Finding from question]
2. [Finding from question]
3. [Finding from question]

**Confirmatory Tests:**
1. [Specific test name and what it shows]
2. [Specific test name and what it shows]
3. [Specific test name and what it shows]

**Immediate Recommendations:**
[Specific next steps: urgent care / ER / specialist / emergency services]

**Safety Note:**
This is a model-based interpretation; confirm with diagnostic testing and a qualified clinician.`;
}

/**
 * Build system prompt with safety instructions
 */
function buildSystemPrompt_DEPRECATED(emergency, hasContext = true) {
  const contextGuidance = hasContext 
    ? "Provide first-aid guidance based on the medical knowledge context provided"
    : "Use your medical knowledge to provide accurate, evidence-based information";
    
  const basePrompt = `You are Cura AI, a medical first-aid guidance assistant.

CRITICAL SAFETY RULES:
1. NEVER diagnose medical conditions
2. NEVER prescribe medications
3. ALWAYS recommend calling emergency services (911/112/108) for serious situations
4. ${contextGuidance}
5. If you're uncertain, acknowledge it but still provide helpful guidance

Your role is to:
- Provide clear, step-by-step first-aid instructions
- Keep instructions simple and actionable
- Remain calm and reassuring
- Prioritize safety above all else
- Answer questions to the best of your medical knowledge`;

  if (emergency) {
    return `${basePrompt}

⚠️ EMERGENCY MODE ACTIVE ⚠️
This is a critical emergency situation. Your response must:
1. Start with "CALL EMERGENCY SERVICES IMMEDIATELY (911/112/108)"
2. Provide immediate life-saving actions (CPR, stop bleeding, etc.)
3. Keep instructions extremely clear and brief
4. Focus only on the most critical immediate actions
5. Avoid any non-essential information`;
  }
  
  return basePrompt;
}

/**
 * Log RAG events for analytics and dataset improvement
 */
function logRAGEvent(event) {
  // TODO: Implement proper logging to database/file for continuous improvement
  console.log(`[RAG Analytics] ${JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event
  })}`);
  
  // Future: Save to database for:
  // - Monitoring retrieval quality over time
  // - Identifying queries that need better sources
  // - Curating fallback answers for dataset addition
  // - A/B testing different thresholds
}

/**
 * Build text content from Pinecone metadata
 * Handles different dataset formats (question/answer, context, etc.)
 */
function buildTextFromMetadata(metadata) {
  if (!metadata) return "";
  
  // If metadata has pre-built text field, use it
  if (metadata.text) return metadata.text;
  
  // Otherwise build from question/answer/context
  let text = "";
  
  if (metadata.question) {
    text += `Question: ${metadata.question}\n\n`;
  }
  
  if (metadata.answer) {
    text += `Answer: ${metadata.answer}`;
  } else if (metadata.response) {
    text += `Answer: ${metadata.response}`;
  }
  
  if (metadata.context && !metadata.answer) {
    text += `Context: ${metadata.context}`;
  }
  
  if (metadata.explanation) {
    text += `\n\nExplanation: ${metadata.explanation}`;
  }
  
  return text.trim() || "No content available";
}

/**
 * Rerank candidates using LLM or embedding similarity
 */
async function rerankCandidates(query, candidates, topK) {
  const strategy = process.env.RAG_RERANK_STRATEGY || "llm";
  
  if (strategy === "llm") {
    return await rerankWithLLM(query, candidates, topK);
  } else if (strategy === "embedding") {
    return await rerankWithEmbedding(query, candidates, topK);
  } else {
    // No reranking, just return original
    return candidates;
  }
}

/**
 * Rerank using LLM (more accurate but slower/costlier)
 */
async function rerankWithLLM(query, candidates, topK) {
  // Use a lightweight model for reranking
  const rerankerModel = process.env.OPENROUTER_FALLBACK_MODEL || "meta-llama/llama-3.1-8b-instruct:free";
  
  // For each candidate, ask LLM to rate relevance
  const scoredCandidates = await Promise.all(
    candidates.map(async (candidate, idx) => {
      try {
        const prompt = `Rate the relevance of this medical information to the user's question on a scale of 0-10.

Question: ${query}

Medical Information: ${candidate.text.substring(0, 500)}

Respond with ONLY a number from 0-10. No explanation.`;

        const response = await callOpenRouterModel({
          model: rerankerModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          maxTokens: 10
        });
        
        const scoreText = response.choices?.[0]?.message?.content || "0";
        const score = parseFloat(scoreText.match(/\d+(\.\d+)?/)?.[0] || "0");
        
        return {
          ...candidate,
          rerankScore: score,
          originalScore: candidate.score
        };
      } catch (error) {
        console.error(`[RAG] Reranking failed for candidate ${idx}:`, error.message);
        return {
          ...candidate,
          rerankScore: candidate.score * 5, // Fallback to original score
          originalScore: candidate.score
        };
      }
    })
  );
  
  // Sort by rerank score
  scoredCandidates.sort((a, b) => b.rerankScore - a.rerankScore);
  
  return scoredCandidates.slice(0, topK);
}

/**
 * Rerank using embedding similarity (faster, cheaper)
 */
async function rerankWithEmbedding(query, candidates, topK) {
  // Already ranked by dense retrieval, so just return top K
  // In a more sophisticated implementation, you could:
  // 1. Use a different embedding model
  // 2. Compute cross-encoder scores
  // 3. Use hybrid search (BM25 + dense)
  
  return candidates.slice(0, topK);
}
