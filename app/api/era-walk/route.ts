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
    ghost_quote: string;
    cultural_context: string;
    takeaway: string;
  }>;
}

function fallbackNarrative(seed: (typeof ERA_SEEDS)[ArchetypeId][number], archetypeName: string): Pick<Era, "narrative" | "ghost_quote" | "cultural_context" | "takeaway"> {
  return {
    narrative: `In ${seed.year}, ${seed.athlete_anchor} embodied the ${archetypeName} profile at ${seed.games}. ${seed.achievement}. Athletes with this archetype historically converged on this discipline because the body's natural levers aligned with what the sport demanded.`,
    ghost_quote: `"${seed.achievement.split(";")[0]}." — ${seed.athlete_anchor}`,
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
    .map((s, i) => `${i + 1}. ${s.year} — ${s.games} — ${s.athlete_anchor} — ${s.sport} — ${s.pathway.toUpperCase()} — ${s.achievement}`)
    .join("\n");

  const prompt = `You are writing an editorial mini-documentary script for an interactive 3D museum corridor.

Archetype: ${archetypeName}
Signature color: ${color}
The corridor alternates Olympic and Paralympic anchors — equal weight, equal depth. ${body.paralympicFirst ? "This walk leads with the Paralympic anchor." : "This walk opens with an Olympic anchor."} Treat both pathways with the same editorial voice and the same narrative depth — no condescension or "inspiration" framing for Paralympic athletes; their achievements are athletic, technical, and historic on equal terms.

The corridor has six rooms. Each room corresponds to one historical anchor below — DO NOT change the anchors:

${seedSummary}

For each room, write exactly:
- "narrative": 2 sentences (50–70 words total). Editorial, present-tense, magazine voice. Explain why this athlete's body and discipline aligned with the ${archetypeName} archetype, and what changed after this moment. Use only conditional language about the user ("athletes with this profile", "could", "may", "historically associated with"). NEVER say "you will" or "you can achieve".
- "ghost_quote": 1 short evocative line in first person, attributed to the named athlete. Plausible to their voice; it does not have to be a real verified quote, but should sound like something they might say. Keep under 20 words. Format: "Quote text." — Athlete Name
- "cultural_context": 1 sentence on what was happening in the broader sport / world at that time.
- "takeaway": 1 sentence connecting this moment back to the archetype's pattern of dominance.

Also write:
- "intro": 1 sentence setting up the corridor for a ${archetypeName} viewer (40 words max).
- "outro": 1 sentence sending the viewer forward (30 words max).

Return STRICT JSON, schema:
{
  "intro": string,
  "outro": string,
  "eras": [
    { "year": number, "narrative": string, "ghost_quote": string, "cultural_context": string, "takeaway": string }
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
        ghost_quote: enriched.ghost_quote,
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
