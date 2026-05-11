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
  const result = await withGeminiRetry(() => model.generateContent(prompt), "generateJSON");
  const text = result.response.text();
  return JSON.parse(text) as T;
}

// Transient-error retry wrapper for any Gemini call.
//
// Gemini occasionally returns 503 "Service Unavailable" / 500 / 504 during
// demand spikes. The error message itself recommends retrying. We retry with
// short exponential backoff (500ms, 1000ms, 2000ms) up to 3 attempts.
//
// We do NOT retry:
//   - 4xx other than 429 (the request itself is wrong)
//   - 429 quota errors — those reset per-day on free tier, retrying inside
//     the same request just burns latency. logIfQuotaError handles them.
export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 3
): Promise<T> {
  const delays = [500, 1000, 2000];
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const raw = err instanceof Error ? `${err.message}` : String(err);
      const hay = raw.toLowerCase();

      // 429/quota — don't retry, surface immediately.
      const isQuota =
        hay.includes("429") ||
        hay.includes("quota") ||
        hay.includes("resource_exhausted") ||
        hay.includes("resource exhausted");
      if (isQuota) throw err;

      // Transient: 503 / 500 / 504 / network failure / generic "unavailable".
      const isTransient =
        hay.includes("503") ||
        hay.includes("500") ||
        hay.includes("504") ||
        hay.includes("service unavailable") ||
        hay.includes("unavailable") ||
        hay.includes("high demand") ||
        hay.includes("temporarily") ||
        hay.includes("fetch failed") ||
        hay.includes("network") ||
        hay.includes("econnreset") ||
        hay.includes("etimedout");

      if (!isTransient || attempt === maxRetries - 1) {
        throw err;
      }

      const wait = delays[attempt] ?? 2000;
      console.warn(
        `[GEMINI RETRY] ${label} — attempt ${attempt + 1}/${maxRetries} failed (transient). Retrying in ${wait}ms. Cause: ${raw.split("\n")[0]}`
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
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
