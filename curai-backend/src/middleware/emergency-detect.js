/**
 * Emergency detection middleware
 * Detects emergency keywords in user queries
 */

export const EMERGENCY_KEYWORDS = [
  // Critical medical emergencies
  "help",
  "emergency",
  "accident",
  "urgent",
  "unresponsive",
  "unconscious",
  "not breathing",
  "can't breathe",
  "cannot breathe",
  "difficulty breathing",
  "choking",
  "choke",
  "heart attack",
  "chest pain",
  "stroke",
  "seizure",
  "convulsion",
  "collapse",
  "collapsed",
  "bleeding heavily",
  "bleeding out",
  "severe bleeding",
  "profuse bleeding",
  "suicide",
  "suicidal",
  "kill myself",
  "overdose",
  "poisoning",
  "poisoned",
  "severe pain",
  "extreme pain",
  "unbearable pain",
  "losing consciousness",
  "passing out",
  "blacking out",
  "anaphylaxis",
  "allergic reaction",
  "severe allergic",
  "can't wake up",
  "won't wake up",
  "not responding",
  "amputation",
  "amputated",
  "severed",
  "impaled",
  "stab wound",
  "gunshot",
  "shot",
  "injury",
  "hurt",
  "hospital now",
  "i don't know what to do",
  "i dont know what to do",
  "burn victim",
  "severe burn",
  "electrocuted",
  "drowning",
  "drowned",
  "blue lips",
  "blue face",
  "no pulse",
  "cardiac arrest"
];

// Severity levels
const CRITICAL_KEYWORDS = [
  "not breathing",
  "can't breathe",
  "cannot breathe",
  "unresponsive",
  "unconscious",
  "no pulse",
  "cardiac arrest",
  "heart attack",
  "stroke",
  "seizure",
  "severe bleeding",
  "bleeding heavily"
];

/**
 * Detect emergency keywords in request
 * @param {Object} request - Fastify request object
 * @returns {Object|null} - Emergency detection result or null
 */
export function emergencyMiddleware(request) {
  const text = extractTextFromRequest(request);
  return detectEmergencyFromText(text);
}

export function detectEmergencyFromText(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const lowerText = text.toLowerCase();
  const foundKeywords = [];
  const criticalKeywords = [];
  
  for (const keyword of EMERGENCY_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
      if (CRITICAL_KEYWORDS.includes(keyword)) {
        criticalKeywords.push(keyword);
      }
    }
  }
  
  if (foundKeywords.length === 0) {
    return null;
  }
  
  const severity = criticalKeywords.length > 0 ? "critical" : "urgent";
  
  return {
    detected: true,
    severity,
    keywords: foundKeywords,
    criticalKeywords,
    recommendedAction: severity === "critical" 
      ? "CALL 911/112/108 IMMEDIATELY" 
      : "Seek immediate medical attention",
    timestamp: new Date().toISOString()
  };
}

export function isEmergencyText(text) {
  return detectEmergencyFromText(text);
}

/**
 * Extract text from various request formats
 */
function extractTextFromRequest(request) {
  // Try body.query first (most common)
  if (request.body?.query) {
    return request.body.query;
  }
  
  // Try body.text
  if (request.body?.text) {
    return request.body.text;
  }
  
  // Try body.message
  if (request.body?.message) {
    return request.body.message;
  }
  
  // Try query params
  if (request.query?.q || request.query?.query) {
    return request.query.q || request.query.query;
  }
  
  // Try to stringify entire body as fallback
  if (request.body && typeof request.body === "object") {
    return JSON.stringify(request.body);
  }
  
  return null;
}

/**
 * Get emergency response template
 * @param {string} severity - "critical" or "urgent"
 * @returns {string} - Emergency response template
 */
export function getEmergencyResponseTemplate(severity) {
  if (severity === "critical") {
    return `🚨 CRITICAL EMERGENCY DETECTED 🚨

IMMEDIATE ACTIONS:
1. CALL EMERGENCY SERVICES NOW: 911 (US), 112 (EU), 108 (India)
2. Stay on the line with emergency services
3. Follow dispatcher instructions exactly
4. Do NOT move the person unless in immediate danger

While waiting for help:
`;
  } else {
    return `⚠️ MEDICAL EMERGENCY - SEEK IMMEDIATE HELP ⚠️

RECOMMENDED ACTIONS:
1. Call emergency services if situation worsens: 911 (US), 112 (EU), 108 (India)
2. Monitor the person's condition closely
3. Be prepared to provide emergency responders with details

Immediate steps you can take:
`;
  }
}

/**
 * Validate emergency keywords configuration
 */
export function validateEmergencyKeywords() {
  const issues = [];
  
  // Check for duplicates
  const uniqueKeywords = new Set(EMERGENCY_KEYWORDS.map(k => k.toLowerCase()));
  if (uniqueKeywords.size !== EMERGENCY_KEYWORDS.length) {
    issues.push("Duplicate keywords detected");
  }
  
  // Check that all critical keywords are in main list
  for (const critical of CRITICAL_KEYWORDS) {
    if (!EMERGENCY_KEYWORDS.includes(critical)) {
      issues.push(`Critical keyword "${critical}" not in main keyword list`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    totalKeywords: EMERGENCY_KEYWORDS.length,
    criticalKeywords: CRITICAL_KEYWORDS.length
  };
}
