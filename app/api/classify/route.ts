// Licensed under the Apache License, Version 2.0
import { NextResponse } from "next/server";
import { getFlashModel, logIfQuotaError } from "@/lib/gemini";
import { type FormData, type ClassificationResult } from "@/store/athleteStore";
import { ARCHETYPES, ARCHETYPE_CENTROIDS, SPORT_CENTROIDS } from "@/lib/archetypes";
import { computeSportMatchPercent, rankArchetypes, type UserBiometrics, type ArchetypeScore } from "@/lib/similarity";
import type { ArchetypeId } from "@/lib/constants";

export const runtime = "nodejs";

interface ClassifyReq {
  formData: Partial<FormData>;
  conversationSummary: string;
}

const CLASSIFY_PROMPT = (
  formData: Partial<FormData>,
  summary: string,
  shortlist: ArchetypeScore[]
) => {
  const candidates = shortlist
    .map((s) => {
      const a = ARCHETYPES.find((x) => x.id === s.id)!;
      return `- id ${a.id}: ${a.name} ${a.emoji}
    Tagline: ${a.tagline}
    Olympic primaries: ${a.olympicSports.slice(0, 4).join(", ")}
    Paralympic primaries: ${a.paralympicSports.slice(0, 4).join(", ")}
    Score: ${s.score.toFixed(3)} (biometric_fit ${s.biometricFit.toFixed(2)}, signal_boost ${s.signalBoost.toFixed(2)})
    Reasons: ${s.reasons.join("; ") || "—"}`;
    })
    .join("\n");

  return `You are an elite sports analyst classifying a user into a Team USA Athlete Archetype.

USER PROFILE:
${JSON.stringify(formData, null, 2)}

CONVERSATION SUMMARY: ${summary}

A deterministic biometric ranker has shortlisted these THREE candidates. You MUST pick ONE of them — do not invent or pick outside this list:

${candidates}

How to choose:
- Default to the top-ranked candidate.
- Override only if the conversation summary contains explicit, dominant evidence pointing to a different shortlisted archetype (e.g. user describes years of throws training while ranker top is Aerobic).
- VERSATILE DYNAMO is reserved for genuine multi-event athletes (decathlon/heptathlon background, top-tier in 3+ disciplines simultaneously). Never assign it as a "safe" answer.

Conditional language ONLY: "could", "may", "historically associated with", "athletes with this profile have". Banned: "you will", "your performance", "you would achieve", "guaranteed".

Return ONLY this JSON, no markdown fences:
{
  "archetype": "ARCHETYPE NAME",
  "archetype_id": <id from shortlist>,
  "tagline": "<archetype's tagline>",
  "stats": { "power": <0-10>, "endurance": <0-10>, "precision": <0-10> },
  "olympic_sports": [
    { "name": "<sport>", "blurb": "<1-2 sentence why with conditional language>" },
    { "name": "<sport>", "blurb": "..." },
    { "name": "<sport>", "blurb": "..." }
  ],
  "paralympic_sports": [
    { "name": "<sport>", "blurb": "..." },
    { "name": "<sport>", "blurb": "..." },
    { "name": "<sport>", "blurb": "..." }
  ],
  "reasoning": "<2 sentences why this archetype fits, conditional language>",
  "athlete_story": "<3-5 sentences framing user's body type as aligned with Team USA athletes of this archetype, conditional language>",
  "paralympic_first": <true|false>
}`;
};

interface GeminiResponse {
  archetype: string;
  archetype_id: number;
  tagline: string;
  stats: { power: number; endurance: number; precision: number };
  olympic_sports: { name: string; blurb: string }[];
  paralympic_sports: { name: string; blurb: string }[];
  reasoning: string;
  athlete_story: string;
  paralympic_first: boolean;
}

function deterministicResult(
  formData: Partial<FormData>,
  shortlist: ArchetypeScore[]
): ClassificationResult {
  const top = shortlist[0];
  const a = ARCHETYPES.find((x) => x.id === top.id)!;
  return {
    archetype: a.name,
    archetype_id: a.id,
    tagline: a.tagline,
    stats: a.stats,
    olympic_sports: a.olympicSports.slice(0, 3).map((s) => ({
      name: s,
      match_percent: 80,
      blurb: `Athletes with this archetype have historically been represented in ${s} on Team USA rosters.`,
      pathway: "olympic" as const,
    })),
    paralympic_sports: a.paralympicSports.slice(0, 3).map((s) => ({
      name: s,
      match_percent: 80,
      blurb: `Para-athletes with this profile have historically aligned with ${s}.`,
      pathway: "paralympic" as const,
    })),
    reasoning:
      top.reasons[0] ??
      `Biometric profile aligns with the ${a.name} centroid relative to other archetypes.`,
    paralympic_first: !!formData.has_impairment,
    athlete_story: a.tagline,
  };
}

export async function POST(req: Request) {
  let body: ClassifyReq;
  try {
    body = (await req.json()) as ClassifyReq;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { formData, conversationSummary } = body;
  const userBiometrics: UserBiometrics = {
    height_cm: formData.height_cm ?? 178,
    weight_kg: formData.weight_kg ?? 75,
    arm_span_cm: formData.arm_span_cm ?? formData.height_cm ?? 178,
  };

  // Deterministic ranker — same scoring used for shortlist + fallback.
  // Summary keywords let explicit user intent ("explosive power", "endurance")
  // override biometric distance for average-build users.
  const ranking = rankArchetypes(userBiometrics, formData, conversationSummary);
  const shortlist = ranking.slice(0, 3);

  console.log(
    `[CLASSIFY] ranker top-5: ${ranking
      .slice(0, 5)
      .map((r) => `${r.id}=${r.score.toFixed(2)}`)
      .join(", ")}`
  );

  let parsed: GeminiResponse | null = null;
  try {
    const model = getFlashModel();
    const result = await model.generateContent(CLASSIFY_PROMPT(formData, conversationSummary, shortlist));
    parsed = JSON.parse(result.response.text());
  } catch (geminiErr) {
    const wasQuota = logIfQuotaError(geminiErr, "classify");
    if (!wasQuota) {
      console.error("[CLASSIFY] Gemini call failed (non-quota):", geminiErr);
    }
    return NextResponse.json(deterministicResult(formData, shortlist));
  }

  if (!parsed) {
    return NextResponse.json(deterministicResult(formData, shortlist));
  }

  // Hard guard: clamp Gemini's pick to the shortlist if it deviated
  const allowedIds = new Set(shortlist.map((s) => s.id));
  if (!allowedIds.has(parsed.archetype_id as ArchetypeId)) {
    console.warn(
      `[CLASSIFY] Gemini picked ${parsed.archetype_id} outside shortlist [${[...allowedIds].join(",")}] — overriding to top.`
    );
    const a = ARCHETYPES.find((x) => x.id === shortlist[0].id)!;
    parsed.archetype_id = a.id;
    parsed.archetype = a.name;
    parsed.tagline = a.tagline;
  }

  // Compute match percentages from cosine similarity
  const olympic_sports = parsed.olympic_sports.map((s) => {
    const centroid = SPORT_CENTROIDS[s.name] ?? ARCHETYPE_CENTROIDS[parsed!.archetype_id as ArchetypeId];
    return {
      name: s.name,
      blurb: s.blurb,
      match_percent: computeSportMatchPercent(userBiometrics, centroid),
      pathway: "olympic" as const,
    };
  });

  const paralympic_sports = parsed.paralympic_sports.map((s) => {
    const centroid = SPORT_CENTROIDS[s.name] ?? ARCHETYPE_CENTROIDS[parsed!.archetype_id as ArchetypeId];
    return {
      name: s.name,
      blurb: s.blurb,
      match_percent: computeSportMatchPercent(userBiometrics, centroid),
      pathway: "paralympic" as const,
    };
  });

  const result: ClassificationResult = {
    archetype: parsed.archetype,
    archetype_id: parsed.archetype_id,
    tagline: parsed.tagline,
    stats: parsed.stats,
    olympic_sports,
    paralympic_sports,
    reasoning: parsed.reasoning,
    athlete_story: parsed.athlete_story,
    paralympic_first: parsed.paralympic_first || (formData.has_impairment ?? false),
  };

  return NextResponse.json(result);
}
