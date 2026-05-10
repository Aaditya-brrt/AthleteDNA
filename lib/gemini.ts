// Licensed under the Apache License, Version 2.0
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
  if (!_client) _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

export function getFlashModel() {
  return getClient().getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });
}

export function getProModel() {
  return getClient().getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
    },
  });
}

export async function generateJSON<T>(
  model: ReturnType<typeof getFlashModel>,
  prompt: string
): Promise<T> {
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text) as T;
}

// Detect quota / rate-limit errors from Google's GenAI SDK and log clearly to
// the terminal. Returns true if the error matches a known quota signature so
// callers can branch on it (e.g. fall back to deterministic logic).
export function logIfQuotaError(err: unknown, context: string): boolean {
  const raw = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
  const hay = raw.toLowerCase();
  const isQuota =
    hay.includes("429") ||
    hay.includes("quota") ||
    hay.includes("rate limit") ||
    hay.includes("rate_limit") ||
    hay.includes("resource_exhausted") ||
    hay.includes("resource exhausted") ||
    hay.includes("too many requests");

  if (isQuota) {
    console.warn(
      `\n[GEMINI QUOTA] ${context} — quota or rate limit reached.\n` +
        `  Free-tier Flash limits reset every 24h. Falling back to deterministic logic.\n` +
        `  Mitigations: 1) wait for reset  2) upgrade tier (https://aistudio.google.com/app/apikey)  3) reduce calls per session.\n` +
        `  Raw error: ${raw.split("\n")[0]}\n`
    );
  }
  return isQuota;
}
