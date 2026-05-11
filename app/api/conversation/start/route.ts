// Licensed under the Apache License, Version 2.0
import { NextResponse } from "next/server";
import { getFlashModel, logIfQuotaError, withGeminiRetry } from "@/lib/gemini";
import { type FormData } from "@/store/athleteStore";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an elite sports scientist and athlete profiling agent for Team USA.
You receive biometric data about a user and ask 3-5 targeted follow-up questions to sharpen their Athlete Archetype assignment.

Rules:
- Ask only ONE question at a time
- Questions must dig deeper into ambiguities in the biometric data
- Always return JSON in this exact format: { "question": "...", "options": ["...", "..."], "type": "select" }
- For open-ended questions, omit options and set type to "text"
- After 3-5 questions, return: { "done": true, "summary": "2-3 sentence summary of the full profile" }
- NEVER ask about medical history beyond what the user already provided
- NEVER make performance predictions or guarantees
- NEVER identify specific private individuals from biometrics
- Use conditional language: "could suggest", "may align with", "historically associated with"
- Keep questions conversational but precise — like a scout interview
- If the user indicated a disability/impairment, ask at least one follow-up about which side is affected, severity level, or sport history with the impairment
- Examples:
  * If arm span >> height: "Your arm span is notably longer than your height — in activities you've done, have you felt particularly effective at reaching, throwing, or pulling movements?"
  * If high weight + strength sports: "When you've lifted or pushed heavy loads, do you feel your power comes more from your legs and hips, or your upper body?"
  * If hypermobile flexibility: "With your high flexibility, have you ever been told you're 'double-jointed' or had coaches comment on your range of motion?"`;

interface StartReq {
  formData: Partial<FormData>;
}

interface Message {
  role: "user" | "model";
  parts: { text: string }[];
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
    const body = (await req.json()) as StartReq;
    const userIntro = `Biometric data received:\n${JSON.stringify(body.formData, null, 2)}\n\nAsk your first follow-up question now. Return JSON only.`;

    const model = getFlashModel();
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: '{"acknowledged": true}' }] },
      ],
    });
    const result = await withGeminiRetry(
      () => chat.sendMessage(userIntro),
      "conversation/start"
    );
    const text = result.response.text();

    let parsed: QuestionResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { question: text, type: "text" };
    }

    const conversationHistory: Message[] = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: '{"acknowledged": true}' }] },
      { role: "user", parts: [{ text: userIntro }] },
      { role: "model", parts: [{ text }] },
    ];

    return NextResponse.json({ ...parsed, conversationHistory });
  } catch (e) {
    if (!logIfQuotaError(e, "conversation/start")) {
      console.error("[CONVERSATION/START] Gemini call failed (non-quota):", e);
    }
    // Fallback question to keep flow alive even if Gemini fails
    return NextResponse.json({
      question: "Tell us about a moment in sport when you felt most physically effective — what were you doing?",
      type: "text",
      conversationHistory: [],
      _fallback: true,
    });
  }
}
