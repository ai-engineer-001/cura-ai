/**
 * Text-to-Speech service
 * Supports Edge-TTS and other TTS providers
 */

import child_process from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate speech audio from text
 * @param {string} text - Text to synthesize
 * @param {Object} options - TTS options
 * @returns {Promise<Buffer>} - Audio buffer
 */
export async function synthesizeSpeech(text, options = {}) {
  const provider = process.env.TTS_PROVIDER || "edge-tts";
  
  switch (provider) {
    case "edge-tts":
      return await synthesizeWithEdgeTTS(text, options);
    case "local":
      return await synthesizeWithLocal(text, options);
    default:
      throw new Error(`Unknown TTS provider: ${provider}`);
  }
}

/**
 * Synthesize speech using Edge-TTS (Microsoft)
 * Requires: pip install edge-tts
 */
async function synthesizeWithEdgeTTS(text, options = {}) {
  const voice = options.voice || "en-US-AriaNeural"; // Female voice
  const rate = options.rate || "+0%";
  const volume = options.volume || "+0%";
  
  const tmpDir = "/tmp";
  const timestamp = Date.now();
  const outputPath = path.join(tmpDir, `tts_${timestamp}.mp3`);
  
  try {
    // Run edge-tts command
    // edge-tts --voice "en-US-AriaNeural" --text "Hello" --write-media output.mp3
    const result = child_process.spawnSync(
      "edge-tts",
      [
        "--voice", voice,
        "--rate", rate,
        "--volume", volume,
        "--text", text,
        "--write-media", outputPath
      ],
      {
        timeout: 30000,
        encoding: "utf8"
      }
    );
    
    if (result.error) {
      throw new Error(`edge-tts execution failed: ${result.error.message}`);
    }
    
    if (result.status !== 0) {
      throw new Error(`edge-tts exited with code ${result.status}: ${result.stderr}`);
    }
    
    if (!fs.existsSync(outputPath)) {
      throw new Error("TTS audio file not created");
    }
    
    const audioBuffer = fs.readFileSync(outputPath);
    
    // Cleanup
    fs.unlinkSync(outputPath);
    
    return audioBuffer;
  } catch (error) {
    // Cleanup on error
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    throw error;
  }
}

/**
 * Synthesize speech using local TTS engine
 * This is a placeholder for custom TTS implementations
 */
async function synthesizeWithLocal(text, options = {}) {
  throw new Error("Local TTS not yet implemented. Use TTS_PROVIDER=edge-tts");
}

/**
 * Stream TTS audio in chunks
 * Useful for real-time playback as text is generated
 */
export async function* streamSpeech(text, options = {}) {
  // For Edge-TTS, we generate the full audio first
  // For streaming, you'd need a TTS service that supports streaming
  
  const audioBuffer = await synthesizeSpeech(text, options);
  
  // Chunk the audio buffer for streaming
  const chunkSize = 4096; // 4KB chunks
  
  for (let i = 0; i < audioBuffer.length; i += chunkSize) {
    yield audioBuffer.slice(i, i + chunkSize);
  }
}

/**
 * Get available TTS voices
 */
export async function getAvailableVoices() {
  const provider = process.env.TTS_PROVIDER || "edge-tts";
  
  if (provider === "edge-tts") {
    return [
      { id: "en-US-AriaNeural", name: "Aria (Female, US)", language: "en-US", gender: "Female" },
      { id: "en-US-GuyNeural", name: "Guy (Male, US)", language: "en-US", gender: "Male" },
      { id: "en-GB-SoniaNeural", name: "Sonia (Female, UK)", language: "en-GB", gender: "Female" },
      { id: "en-GB-RyanNeural", name: "Ryan (Male, UK)", language: "en-GB", gender: "Male" },
      { id: "en-AU-NatashaNeural", name: "Natasha (Female, AU)", language: "en-AU", gender: "Female" },
      { id: "en-IN-NeerjaNeural", name: "Neerja (Female, IN)", language: "en-IN", gender: "Female" }
    ];
  }
  
  return [];
}

/**
 * Convert text to phonetic representation
 * Useful for pronunciation improvements
 */
export function textToPhonetic(text) {
  // This would use a phonetic library or API
  // For now, return the original text
  return text;
}
