import child_process from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Transcribe audio chunk using local whisper.cpp or fallback to OpenRouter
 * @param {string} base64Audio - Base64-encoded audio data
 * @param {string} format - Audio format (webm, wav, mp3, etc.)
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeChunk(base64Audio, format = "webm") {
  // Try local whisper.cpp first
  if (process.env.WHISPER_CPP_PATH && fs.existsSync(process.env.WHISPER_CPP_PATH)) {
    try {
      return await transcribeWithWhisperCpp(base64Audio, format);
    } catch (error) {
      console.warn(`[ASR] Local whisper.cpp failed: ${error.message}`);
      
      // Fallback to OpenRouter if enabled
      if (process.env.ASR_FALLBACK_ENABLED === "true") {
        console.log(`[ASR] Falling back to OpenRouter transcription...`);
        return await transcribeWithOpenRouter(base64Audio, format);
      }
      
      throw error;
    }
  }
  
  // No local whisper.cpp available, use OpenRouter
  if (process.env.ASR_FALLBACK_ENABLED === "true") {
    return await transcribeWithOpenRouter(base64Audio, format);
  }
  
  throw new Error("ASR not configured. Set WHISPER_CPP_PATH or enable ASR_FALLBACK_ENABLED=true");
}

/**
 * Transcribe using local whisper.cpp binary
 */
async function transcribeWithWhisperCpp(base64Audio, format) {
  const tmpDir = "/tmp";
  const timestamp = Date.now();
  const audioPath = path.join(tmpDir, `audio_${timestamp}.${format}`);
  const outputPath = path.join(tmpDir, `transcript_${timestamp}.txt`);
  
  try {
    // Write audio file
    const audioBuffer = Buffer.from(base64Audio, "base64");
    fs.writeFileSync(audioPath, audioBuffer);
    
    // Run whisper.cpp
    const whisperPath = process.env.WHISPER_CPP_PATH;
    
    // Adjust these arguments based on your whisper.cpp build
    // Common usage: ./whisper -m model.bin -f audio.wav -otxt
    const args = [
      "-m", process.env.WHISPER_MODEL_PATH || "/usr/local/share/whisper/ggml-base.en.bin",
      "-f", audioPath,
      "-otxt",
      "-of", path.join(tmpDir, `transcript_${timestamp}`)
    ];
    
    const result = child_process.spawnSync(whisperPath, args, {
      timeout: 30000,
      encoding: "utf8"
    });
    
    if (result.error) {
      throw new Error(`whisper.cpp execution failed: ${result.error.message}`);
    }
    
    if (result.status !== 0) {
      throw new Error(`whisper.cpp exited with code ${result.status}: ${result.stderr}`);
    }
    
    // Read transcription
    const transcriptPath = `${path.join(tmpDir, `transcript_${timestamp}`)}.txt`;
    
    if (!fs.existsSync(transcriptPath)) {
      throw new Error("Transcription file not created");
    }
    
    const text = fs.readFileSync(transcriptPath, "utf8").trim();
    
    // Cleanup
    fs.unlinkSync(audioPath);
    fs.unlinkSync(transcriptPath);
    
    return text;
  } catch (error) {
    // Cleanup on error
    try {
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    throw error;
  }
}

/**
 * Transcribe using OpenRouter (if they support audio transcription)
 * Note: This is a placeholder - OpenRouter may not have direct transcription API
 * You might need to use OpenAI's Whisper API directly or another service
 */
async function transcribeWithOpenRouter(base64Audio, format) {
  // TODO: Implement OpenRouter transcription if available
  // For now, return a placeholder
  
  throw new Error("OpenRouter transcription not yet implemented. Configure local whisper.cpp with WHISPER_CPP_PATH");
  
  // Example implementation if using OpenAI Whisper API directly:
  /*
  import axios from "axios";
  import FormData from "form-data";
  
  const formData = new FormData();
  const audioBuffer = Buffer.from(base64Audio, "base64");
  formData.append("file", audioBuffer, { filename: `audio.${format}` });
  formData.append("model", "whisper-1");
  
  const response = await axios.post(
    "https://api.openai.com/v1/audio/transcriptions",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );
  
  return response.data.text;
  */
}

/**
 * Transcribe audio file from disk
 * @param {string} filePath - Path to audio file
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found: ${filePath}`);
  }
  
  const audioBuffer = fs.readFileSync(filePath);
  const base64Audio = audioBuffer.toString("base64");
  const format = path.extname(filePath).slice(1); // Remove dot
  
  return await transcribeChunk(base64Audio, format);
}

/**
 * Stream transcription for continuous audio
 * This would integrate with a VAD (Voice Activity Detection) system
 */
export class StreamingASR {
  constructor() {
    this.buffer = [];
    this.bufferDuration = 0;
    this.maxBufferDuration = 3000; // 3 seconds
  }
  
  /**
   * Add audio chunk to buffer
   */
  addChunk(audioData) {
    this.buffer.push(audioData);
    // In production, track actual duration based on sample rate
    this.bufferDuration += 100; // Approximate
  }
  
  /**
   * Check if buffer is ready for transcription
   */
  shouldTranscribe() {
    return this.bufferDuration >= this.maxBufferDuration;
  }
  
  /**
   * Get buffered audio and reset
   */
  getBufferedAudio() {
    const combined = Buffer.concat(this.buffer.map(b => Buffer.from(b, "base64")));
    const base64 = combined.toString("base64");
    
    this.buffer = [];
    this.bufferDuration = 0;
    
    return base64;
  }
  
  /**
   * Transcribe buffered audio
   */
  async transcribe() {
    if (this.buffer.length === 0) {
      return "";
    }
    
    const audio = this.getBufferedAudio();
    return await transcribeChunk(audio, "webm");
  }
}
