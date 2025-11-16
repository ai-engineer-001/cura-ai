import { callOpenRouterModel } from "./openrouter.js";
import { isEmergencyText } from "../middleware/emergency-detect.js";

const HARD_RULE_KEYWORDS = [
  "accident",
  "help",
  "emergency",
  "bleeding",
  "can't breathe",
  "cant breathe",
  "injury",
  "hurt",
  "hospital now",
  "i don't know what to do",
  "i dont know what to do"
];

function buildSituationSummary(text) {
  if (!text || typeof text !== "string") {
    return "unknown emergency situation";
  }

  const lower = text.toLowerCase();

  if (lower.includes("burn")) {
    if (lower.includes("gas") || lower.includes("fire") || lower.includes("flame")) {
      return "possible burn injury, likely from gas or fire at home";
    }
    return "possible burn injury";
  }

  if (lower.includes("accident") || lower.includes("crash") || lower.includes("hit by")) {
    return "possible accident or trauma (e.g. car or home accident)";
  }

  if (lower.includes("bleeding") || lower.includes("blood")) {
    return "possible bleeding emergency";
  }

  if (lower.includes("can't breathe") || lower.includes("cant breathe") || lower.includes("trouble breathing") || lower.includes("short of breath")) {
    return "possible breathing difficulty";
  }

  if (lower.includes("chest pain")) {
    return "possible chest pain emergency";
  }

  if (lower.includes("fall") || lower.includes("fell")) {
    return "possible fall injury";
  }

  return "possible medical emergency based on their message";
}

export function isEmergencyQuery(text) {
  const detected = isEmergencyText(text);
  if (detected) {
    return detected;
  }
  if (!text || typeof text !== "string") {
    return null;
  }

  const normalized = text.toLowerCase();
  const matchedKeyword = HARD_RULE_KEYWORDS.find((keyword) =>
    normalized.includes(keyword.toLowerCase())
  );

  if (!matchedKeyword) {
    return null;
  }

  return {
    detected: true,
    severity: "urgent",
    keywords: [matchedKeyword],
    criticalKeywords: [],
    recommendedAction: "CALL 911/112/108 IMMEDIATELY",
    timestamp: new Date().toISOString()
  };
}

export async function handleEmergencyQuery({
  query,
  sessionId,
  detection
}) {
  const emergencyDetails =
    detection || isEmergencyQuery(query) || {
      detected: true,
      severity: "urgent",
      keywords: [],
      criticalKeywords: [],
      recommendedAction: "CALL 911/112/108 IMMEDIATELY",
      timestamp: new Date().toISOString()
    };

  const situationSummary = buildSituationSummary(query);

  const systemPrompt = `You are Cura AI Emergency First-Aid assistant. Your only job is to keep the user safe until professional responders arrive. Use calm, clear sentences. Never provide clinical diagnoses or anything that requires professional tools. Encourage calling emergency services immediately.`;

  const userPrompt = `The user might be facing a medical emergency.
User message: ${query}

Situation summary (may be imperfect): ${situationSummary}.

Produce a concise response (max 4 short paragraphs) using these rules:
1. Start by firmly telling them to call emergency services right now (mention 911/112/108 generically).
2. Refer explicitly to their situation using plain language. For example, say things like "because you mentioned a gas burn at home..." or "since you said you were in an accident...". Do NOT invent new facts.
3. Ask 2 to 4 short yes/no safety questions about bleeding, breathing, consciousness, surroundings, and at least one question that makes sense for this situation summary.
4. Offer only universally safe first-aid actions (apply pressure to bleeding, keep airway open, move away from danger). For burns, focus on cooling the area with clean running water if available and safe. No invasive or medication advice.
5. Remind them to stay with the person, describe what is happening now, and wait for professionals.
Use short sentences (prefer under 15 words). Avoid technical jargon.`;

  const model =
    process.env.OPENROUTER_EMERGENCY_MODEL || process.env.OPENROUTER_MODEL_ID;

  const response = await callOpenRouterModel({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.05,
    maxTokens: 400
  });

  const content = response?.choices?.[0]?.message?.content?.trim() ||
    "Please contact emergency services immediately.";

  return {
    sessionId,
    emergency: true,
    response: content,
    responseLabel: "emergency_bypass",
    confidenceLevel: "emergency",
    topScore: null,
    fallbackUsed: false,
    sources: [],
    emergencyDetails,
    timestamp: new Date().toISOString()
  };
}
