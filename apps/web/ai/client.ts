import { GoogleGenAI } from "@google/genai";

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

export type GeminiClient = GoogleGenAI;

export function getGeminiClient(apiKey = process.env.GEMINI_API_KEY): GoogleGenAI {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("GEMINI_API_KEY is not defined");
  }

  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient;
  }

  cachedClient = new GoogleGenAI({ apiKey });
  cachedApiKey = apiKey;
  return cachedClient;
}

export function resetGeminiClientCache() {
  cachedClient = null;
  cachedApiKey = null;
}









