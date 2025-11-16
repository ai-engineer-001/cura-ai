/**
 * Safety middleware and policies
 * Enforces medical disclaimer and safety rules
 */

/**
 * Medical disclaimer text
 */
export const MEDICAL_DISCLAIMER = `
⚕️ MEDICAL DISCLAIMER ⚕️

This is an AI assistant providing general first-aid guidance only.

I CANNOT and WILL NOT:
- Diagnose medical conditions
- Prescribe medications
- Replace professional medical advice
- Provide definitive medical treatment plans

YOU SHOULD:
- Call emergency services (911/112/108) for serious situations
- Consult qualified healthcare professionals for medical advice
- Follow local emergency response protocols
- Seek immediate medical attention if condition worsens

This guidance is for informational purposes only and should not be considered medical advice.
`;

/**
 * Safety rules for LLM responses
 */
export const SAFETY_RULES = {
  noDiagnosis: "Never provide definitive medical diagnoses",
  noPrescription: "Never prescribe or recommend specific medications",
  encourageEmergencyCall: "Always recommend calling emergency services for serious situations",
  disclaimerRequired: "Include disclaimer for all medical advice",
  verifyInformation: "Only provide information from verified medical sources",
  prioritizeSafety: "When in doubt, recommend seeking professional medical help"
};

/**
 * Prohibited actions that should trigger safety warnings
 */
const PROHIBITED_PATTERNS = [
  // Diagnosis attempts
  /you (?:have|are|might have|probably have|definitely have)/i,
  /(?:diagnosed with|diagnosis is|diagnosed as)/i,
  /this (?:is|appears to be|seems to be|looks like) (?:a case of|an instance of)/i,
  
  // Prescription attempts
  /take (?:\d+(?:mg|mcg|g)|[a-z]+(?:cillin|mycin|pam|drine|ine|ol))/i,
  /(?:prescri(?:be|ption)|recommend taking|you should take) (?:some |an? )?[a-z]+(?:cillin|mycin|pam|drine|ine|ol)/i,
  
  // Dangerous advice
  /(?:don't|do not|avoid) (?:call|calling|contact|contacting) (?:911|emergency|ambulance|doctor)/i,
  /(?:wait|delay) (?:before|to) (?:call|calling|seek|seeking)/i
];

/**
 * Check response for safety violations
 * @param {string} response - LLM response text
 * @returns {Object} - Safety check result
 */
export function checkResponseSafety(response) {
  const violations = [];
  const warnings = [];
  
  const lowerResponse = response.toLowerCase();
  
  // Check for prohibited patterns
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(response)) {
      violations.push({
        type: "prohibited_pattern",
        pattern: pattern.toString(),
        message: "Response contains prohibited medical advice pattern"
      });
    }
  }
  
  // Check for missing emergency call recommendation in critical situations
  if (lowerResponse.includes("emergency") || lowerResponse.includes("critical")) {
    if (!lowerResponse.includes("call") && !lowerResponse.includes("911") && !lowerResponse.includes("emergency services")) {
      warnings.push({
        type: "missing_emergency_recommendation",
        message: "Emergency situation without explicit call to emergency services"
      });
    }
  }
  
  // Check for disclaimer presence in final responses
  if (response.length > 200 && !lowerResponse.includes("disclaimer") && !lowerResponse.includes("not a substitute")) {
    warnings.push({
      type: "missing_disclaimer",
      message: "Long medical response without disclaimer"
    });
  }
  
  return {
    safe: violations.length === 0,
    violations,
    warnings,
    requiresDisclaimer: warnings.some(w => w.type === "missing_disclaimer"),
    requiresEmergencyPrompt: warnings.some(w => w.type === "missing_emergency_recommendation")
  };
}

/**
 * Append safety disclaimer to response
 * @param {string} response - Original response
 * @param {boolean} isEmergency - Whether this is an emergency situation
 * @returns {string} - Response with disclaimer
 */
export function appendDisclaimer(response, isEmergency = false) {
  let disclaimer = "\n\n---\n";
  
  if (isEmergency) {
    disclaimer += "🚨 EMERGENCY: If this is a life-threatening situation, CALL 911/112/108 IMMEDIATELY.\n\n";
  }
  
  disclaimer += "ℹ️ This information is for first-aid guidance only and not a substitute for professional medical advice. ";
  disclaimer += "Always consult qualified healthcare professionals for medical concerns.";
  
  return response + disclaimer;
}

/**
 * Sanitize user input for safety
 * @param {string} input - User input text
 * @returns {Object} - Sanitization result
 */
export function sanitizeInput(input) {
  const issues = [];
  
  // Check for excessive length
  if (input.length > 5000) {
    issues.push({
      type: "excessive_length",
      message: "Input exceeds maximum length"
    });
    input = input.substring(0, 5000);
  }
  
  // Check for malicious patterns (basic XSS/injection attempts)
  const maliciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /onerror=/gi,
    /onclick=/gi,
    /<iframe/gi
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(input)) {
      issues.push({
        type: "malicious_pattern",
        message: "Input contains potentially malicious content"
      });
    }
  }
  
  return {
    sanitized: input,
    issues,
    safe: issues.length === 0
  };
}

/**
 * Rate limiting helper
 * Simple in-memory rate limiter (use Redis for production)
 */
const rateLimitMap = new Map();

export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const key = identifier;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  const limit = rateLimitMap.get(key);
  
  // Reset if window expired
  if (now >= limit.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  // Increment count
  limit.count++;
  
  if (limit.count > maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      retryAfter: Math.ceil((limit.resetAt - now) / 1000)
    };
  }
  
  return { 
    allowed: true, 
    remaining: maxRequests - limit.count 
  };
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of rateLimitMap.entries()) {
    if (now >= limit.resetAt + 60000) { // Keep for 1 extra minute
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Run every minute
