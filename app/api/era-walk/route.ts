// Licensed under the Apache License, Version 2.0
import { NextResponse } from "next/server";
import { getFlashModel, generateJSON, logIfQuotaError } from "@/lib/gemini";
import { ERA_SEEDS, alternateSeeds, type Era, type EraWalkData } from "@/lib/eraWalk";
import { getArchetypeById } from "@/lib/archetypes";
import type { ArchetypeId } from "@/lib/constants";

export const runtime = "nodejs";

interface EraWalkReq {
  archetypeId: number;
  archetypeName: string;
  paralympicFirst?: boolean;
  userSummary?: string;
}

interface GeminiEraEnrichment {
  intro: string;
  outro: string;
  eras: Array<{
    year: number;
    narrative: string;
    archetype_motto: string;
    cultural_context: string;
    takeaway: string;
  }>;
}

function fallbackNarrative(seed: (typeof ERA_SEEDS)[ArchetypeId][number], archetypeName: string): Pick<Era, "narrative" | "archetype_motto" | "cultural_context" | "takeaway"> {
  return {
    narrative: `In ${seed.year}, the ${archetypeName} profile defined ${seed.sport.toLowerCase()} at ${seed.games}. ${seed.achievement}. Athletes with this archetype historically converged on this discipline because the body's natural levers aligned with what the sport demanded.`,
    archetype_motto: `"${seed.achievement.split(";")[0]}."`,
    cultural_context: `This moment shaped how Team USA approached ${seed.sport.toLowerCase()} for the decades that followed.`,
    takeaway: `Profiles like yours have historically aligned with this kind of breakthrough.`,
  };
}

function buildFallback(archetypeId: number, archetypeName: string, color: string, paralympicFirst: boolean): EraWalkData {
  const ordered = alternateSeeds(archetypeId as ArchetypeId, paralympicFirst);
  return {
    archetype_id: archetypeId,
    archetype_name: archetypeName,
    signature_color: color,
    intro: `Walk the corridor of ${archetypeName} history. Six moments — Olympic and Paralympic — where this archetype shaped Team USA across nearly a century.`,
    outro: `The corridor continues. Athletes with your archetype have written six moments here — the next one waits to be written.`,
    eras: ordered.map((seed) => ({ ...seed, decade: `${Math.floor(seed.year / 10) * 10}s`, ...fallbackNarrative(seed, archetypeName) })),
  };
}

export async function POST(req: Request) {
  let body: EraWalkReq;
  try {
    body = (await req.json()) as EraWalkReq;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const archetype = getArchetypeById(body.archetypeId);
  const archetypeName = body.archetypeName ?? archetype?.name ?? "ATHLETE";
  const color = archetype?.color ?? "#A88134";

  const seeds = ERA_SEEDS[body.archetypeId as ArchetypeId];
  if (!seeds) {
    return NextResponse.json(buildFallback(body.archetypeId, archetypeName, color, body.paralympicFirst ?? false));
  }

  const ordered = alternateSeeds(body.archetypeId as ArchetypeId, body.paralympicFirst ?? false);
  const fallback = buildFallback(body.archetypeId, archetypeName, color, body.paralympicFirst ?? false);

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(fallback);
  }

  const seedSummary = ordered
    .map((s, i) => `${i + 1}. ${s.year} — ${s.games} — ${s.sport} — ${s.pathway.toUpperCase()} — ${s.achievement}`)
    .join("\n");

  const prompt = `You are writing an editorial mini-documentary script for an interactive 3D museum corridor.

Archetype: ${archetypeName}
Signature color: ${color}
The corridor alternates Olympic and Paralympic anchors — equal weight, equal depth. ${body.paralympicFirst ? "This walk leads with the Paralympic anchor." : "This walk opens with an Olympic anchor."} Treat both pathways with the same editorial voice and the same narrative depth — no condescension or "inspiration" framing for Paralympic athletes; their achievements are athletic, technical, and historic on equal terms.

CRITICAL ANONYMITY RULE: never name any individual athlete, past or present. Write entirely about the moment, the discipline, the cohort, and the archetype. If a name is the only way to make a sentence land, rewrite the sentence. Refer to participants as "the Team USA roster", "this cohort", "athletes with this archetype", "the discipline", or by event ("the 100m gold medallist of these Games"). No nicknames, no monikers, no descriptors that identify exactly one person (e.g. "the first American woman to..."). Performance facts (times, distances, medal counts) are fine.

The corridor has six rooms. Each room corresponds to one historical anchor below — DO NOT change the anchors:

${seedSummary}

For each room, write exactly:
- "narrative": 2 sentences (50–70 words total). Editorial, present-tense, magazine voice. Explain why this discipline and this archetype converged at this moment, and what changed in the sport after. Use only conditional language about the user ("athletes with this profile", "could", "may", "historically associated with"). NEVER say "you will" or "you can achieve". Never name an athlete.
- "archetype_motto": 1 short manifesto-style line in archetype voice (first person plural "we"), UNATTRIBUTED. No quotation marks attributing to a person. Under 18 words. Example shape: "We arrive heavy and leave first."
- "cultural_context": 1 sentence on what was happening in the broader sport / world at that time. No athlete names.
- "takeaway": 1 sentence connecting this moment back to the archetype's pattern of dominance.

Also write:
- "intro": 1 sentence setting up the corridor for a ${archetypeName} viewer (40 words max). No names.
- "outro": 1 sentence sending the viewer forward (30 words max). No names.

Return STRICT JSON, schema:
{
  "intro": string,
  "outro": string,
  "eras": [
    { "year": number, "narrative": string, "archetype_motto": string, "cultural_context": string, "takeaway": string }
  ]
}

The eras array MUST contain exactly ${seeds.length} entries in the same order as the anchors above, matching their year values.`;

  try {
    const model = getFlashModel();
    const enrichment = await generateJSON<GeminiEraEnrichment>(model, prompt);
    const enrichByYear = new Map(enrichment.eras.map((e) => [e.year, e]));
    const merged: Era[] = ordered.map((seed) => {
      const enriched = enrichByYear.get(seed.year);
      const decade = `${Math.floor(seed.year / 10) * 10}s`;
      if (!enriched) {
        return { ...seed, decade, ...fallbackNarrative(seed, archetypeName) };
      }
      return {
        ...seed,
        decade,
        narrative: enriched.narrative,
        archetype_motto: enriched.archetype_motto,
        cultural_context: enriched.cultural_context,
        takeaway: enriched.takeaway,
      };
    });
    return NextResponse.json({
      archetype_id: body.archetypeId,
      archetype_name: archetypeName,
      signature_color: color,
      intro: enrichment.intro,
      outro: enrichment.outro,
      eras: merged,
    } satisfies EraWalkData);
  } catch (e) {
    if (!logIfQuotaError(e, "era-walk")) {
      console.error("[ERA-WALK] Gemini call failed (non-quota):", e);
    }
    return NextResponse.json(fallback);
  }
}
