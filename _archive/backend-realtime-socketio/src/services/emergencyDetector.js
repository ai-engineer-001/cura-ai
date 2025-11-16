/**
 * Emergency Detector
 * Keyword-based urgency detection and state management
 */

import { config } from '../config.js';
import { logger } from '../logger.js';

const EMERGENCY_STATES = {
  LISTENING: 'LISTENING',
  DETECTING_URGENCY: 'DETECTING_URGENCY',
  PROVIDING_GUIDANCE: 'PROVIDING_GUIDANCE',
  SUGGEST_CALL: 'SUGGEST_CALL',
  CONTINUE_UNTIL_HELP: 'CONTINUE_UNTIL_HELP',
  END: 'END'
};

const EMERGENCY_TYPES = {
  CARDIAC: 'cardiac',
  BREATHING: 'breathing',
  BLEEDING: 'bleeding',
  UNCONSCIOUS: 'unconscious',
  CHOKING: 'choking',
  SEIZURE: 'seizure',
  TRAUMA: 'trauma',
  GENERAL: 'general'
};

export class EmergencyDetector {
  /**
   * Detect emergency keywords in text
   */
  detectKeywords(text) {
    const textLower = text.toLowerCase();
    const detected = [];
    
    for (const keyword of config.EMERGENCY_KEYWORDS) {
      if (textLower.includes(keyword)) {
        detected.push(keyword);
      }
    }
    
    return detected;
  }
  
  /**
   * Detect emergency type from text
   */
  detectEmergencyType(text) {
    const textLower = text.toLowerCase();
    
    // Cardiac keywords
    if (/chest pain|heart attack|cardiac|crushing/.test(textLower)) {
      return EMERGENCY_TYPES.CARDIAC;
    }
    
    // Breathing keywords
    if (/can't breathe|not breathing|gasping|wheezing|choking on air/.test(textLower)) {
      return EMERGENCY_TYPES.BREATHING;
    }
    
    // Bleeding keywords
    if (/bleeding heavily|blood gushing|can't stop bleeding/.test(textLower)) {
      return EMERGENCY_TYPES.BLEEDING;
    }
    
    // Unconscious keywords
    if (/unconscious|not responsive|passed out|won't wake/.test(textLower)) {
      return EMERGENCY_TYPES.UNCONSCIOUS;
    }
    
    // Choking keywords
    if (/choking|can't swallow|stuck in throat/.test(textLower)) {
      return EMERGENCY_TYPES.CHOKING;
    }
    
    // Seizure keywords
    if (/seizure|convulsing|shaking uncontrollably/.test(textLower)) {
      return EMERGENCY_TYPES.SEIZURE;
    }
    
    // Trauma keywords
    if (/fell|hit head|car accident|broken bone/.test(textLower)) {
      return EMERGENCY_TYPES.TRAUMA;
    }
    
    // General emergency
    const keywords = this.detectKeywords(text);
    if (keywords.length > 0) {
      return EMERGENCY_TYPES.GENERAL;
    }
    
    return null;
  }
  
  /**
   * Calculate urgency score (0-10)
   */
  calculateUrgency(text) {
    const textLower = text.toLowerCase();
    let score = 0;
    
    // High urgency words
    const highUrgency = ['immediately', 'right now', 'emergency', 'urgent', 'critical', 'severe'];
    for (const word of highUrgency) {
      if (textLower.includes(word)) score += 2;
    }
    
    // Time indicators
    if (/sudden|just happened|just now/.test(textLower)) score += 1;
    
    // Pain level
    if (/10\/10|worst pain|excruciating|unbearable/.test(textLower)) score += 2;
    
    // Consciousness
    if (/unconscious|unresponsive|passed out/.test(textLower)) score += 3;
    
    // Multiple emergency keywords
    const keywords = this.detectKeywords(text);
    score += Math.min(keywords.length, 3);
    
    return Math.min(score, 10);
  }
  
  /**
   * Transition emergency state
   */
  transitionState(context, text) {
    const currentState = context.emergencyState || EMERGENCY_STATES.LISTENING;
    const emergencyType = this.detectEmergencyType(text);
    const urgency = this.calculateUrgency(text);
    
    let newState = currentState;
    let requiresCall = false;
    
    // State transitions
    if (currentState === EMERGENCY_STATES.LISTENING) {
      if (emergencyType) {
        newState = EMERGENCY_STATES.DETECTING_URGENCY;
      }
    } else if (currentState === EMERGENCY_STATES.DETECTING_URGENCY) {
      if (urgency >= config.URGENCY_THRESHOLD) {
        newState = EMERGENCY_STATES.SUGGEST_CALL;
        requiresCall = true;
      } else {
        newState = EMERGENCY_STATES.PROVIDING_GUIDANCE;
      }
    } else if (currentState === EMERGENCY_STATES.PROVIDING_GUIDANCE) {
      if (urgency >= 7) {
        newState = EMERGENCY_STATES.SUGGEST_CALL;
        requiresCall = true;
      }
    } else if (currentState === EMERGENCY_STATES.SUGGEST_CALL) {
      if (/called|calling|on the phone/.test(text.toLowerCase())) {
        newState = EMERGENCY_STATES.CONTINUE_UNTIL_HELP;
      }
    } else if (currentState === EMERGENCY_STATES.CONTINUE_UNTIL_HELP) {
      if (/arrived|here now|they're here/.test(text.toLowerCase())) {
        newState = EMERGENCY_STATES.END;
      }
    }
    
    // Update context
    context.emergencyState = newState;
    context.emergencyType = emergencyType;
    context.urgencyScore = urgency;
    
    logger.info('Emergency state transition', {
      sessionId: context.sessionId,
      from: currentState,
      to: newState,
      emergencyType,
      urgency,
      requiresCall
    });
    
    return {
      state: newState,
      previousState: currentState,
      emergencyType,
      urgency,
      requiresCall,
      keywords: this.detectKeywords(text)
    };
  }
}

export default EmergencyDetector;
export { EMERGENCY_STATES, EMERGENCY_TYPES };
