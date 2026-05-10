// Licensed under the Apache License, Version 2.0
import { NextResponse } from "next/server";
import { getFlashModel, logIfQuotaError } from "@/lib/gemini";

export const runtime = "nodejs";

interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

interface ContinueReq {
  answer: string;
  conversationHistory: Message[];
}

interface QuestionResponse {
  question?: string;
  options?: string[];
  type?: "text" | "select";
  done?: boolean;
  summary?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContinueReq;
    const turnCount = body.conversationHistory.filter((m) => m.role === "model").length;

    // After 3-5 model turns total (system ack + 3-4 questions), force a summary
    const userMessage = turnCount >= 5
      ? `User answered: "${body.answer}". You have asked enough questions. Now return JSON: { "done": true, "summary": "2-3 sentence summary of the full profile" }`
      : `User answered: "${body.answer}". Ask the next question, OR if you have enough information after this turn, return { "done": true, "summary": "..." }. Return JSON only.`;

    const model = getFlashModel();
    const chat = model.startChat({ history: body.conversationHistory });
    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();

    let parsed: QuestionResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { done: true, summary: "Profile gathered." };
    }

    const newHistory: Message[] = [
      ...body.conversationHistory,
      { role: "user", parts: [{ text: userMessage }] },
      { role: "model", parts: [{ text }] },
    ];

    return NextResponse.json({ ...parsed, conversationHistory: newHistory });
  } catch (e) {
    if (!logIfQuotaError(e, "conversation/continue")) {
      console.error("[CONVERSATION/CONTINUE] Gemini call failed (non-quota):", e);
    }
    return NextResponse.json({
      done: true,
      summary: "Profile finalized for archetype matching.",
      _fallback: true,
    });
  }
}
