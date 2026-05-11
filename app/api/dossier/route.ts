// Licensed under the Apache License, Version 2.0
//
// One Gemini call → archetype pick + sport blurbs + twin DNA + era enrichment
// + intro/outro. Replaces three previous endpoints (/api/classify, /api/twins,
// /api/era-walk) for the post-conversation reveal flow.
//
// Server pre-loads:
//   - ranker top-3 archetype shortlist
//   - sport-aware candidate twins per shortlisted archetype (3 Oly + 3 Para)
//   - era seeds per shortlisted archetype (alternating O/P order)
//
// Gemini's job: pick one archetype from shortlist + write all the narrative
// content for it (sports may surface user-selected sport disciplines).
//
// Deterministic fallback fires on quota / parse failure: ranker top pick +
// archetype hardcoded sports + seed era narratives + generic twin DNA strings.
import { NextResponse } from "next/server";
import { ARCHETYPES, ARCHETYPE_CENTROIDS, SPORT_CENTROIDS } from "@/lib/archetypes";
import {
  computeSportMatchPercent,
  rankArchetypes,
  type ArchetypeScore,
  type UserBiometrics,
} from "@/lib/similarity";
import type { ArchetypeId } from "@/lib/constants";
import {
  loadOlympicAthletes,
  loadParalympicAthletes,
  type Athlete,
} from "@/lib/dataLoader";
import { buildCodes, buildTwinPool, selectTwinsSportAware } from "@/lib/twins";
import { ERA_SEEDS, alternateSeeds, type Era, type EraWalkData } from "@/lib/eraWalk";
import { getFlashModel, logIfQuotaError, withGeminiRetry } from "@/lib/gemini";
import type { ClassificationResult, FormData, TwinAthlete } from "@/store/athleteStore";

export const runtime = "nodejs";

interface DossierReq {
  formData: Partial<FormData>;
  conversationSummary: string;
}

export interface DossierResponse {
  classification: ClassificationResult;
  eraWalk: EraWalkData;
  twins: { olympic: TwinAthlete[]; paralympic: TwinAthlete[] };
}

// ─────────────────────────────────────────────────────────────────
// Candidate pre-load.
//
// CandidateBundle = per-shortlisted-archetype: ranker score + era seeds.
// Twin pool is now archetype-agnostic and shared across all candidates:
// sport-overlap first, biometric distance second. Gemini sees the pool
// with stable indices and picks 3 per pathway to weave into the dossier.
// ─────────────────────────────────────────────────────────────────

interface CandidateBundle {
  id: ArchetypeId;
  score: ArchetypeScore;
  eras: Array<Pick<Era, "year" | "games" | "city" | "pathway" | "sport" | "achievement">>;
}

function preloadCandidate(score: ArchetypeScore, paralympicFirst: boolean): CandidateBundle {
  return {
    id: score.id,
    score,
    eras: alternateSeeds(score.id, paralympicFirst),
  };
}

interface TwinPool {
  olympic: Athlete[];
  paralympic: Athlete[];
  olympicCodes: string[];
  paralympicCodes: string[];
}

function buildTwinPools(body: DossierReq, olympic: Athlete[], paralympic: Athlete[]): TwinPool {
  const sex = body.formData.sex ?? "male";
  const h = body.formData.height_cm ?? 178;
  const w = body.formData.weight_kg ?? 75;
  const userSports = body.formData.sports ?? [];

  const olympicPool = buildTwinPool(olympic, h, w, sex, userSports, 8);
  const paralympicPool = buildTwinPool(paralympic, h, w, sex, userSports, 8);

  return {
    olympic: olympicPool,
    paralympic: paralympicPool,
    olympicCodes: buildCodes(olympicPool, "olympic"),
    paralympicCodes: buildCodes(paralympicPool, "paralympic"),
  };
}

// ─────────────────────────────────────────────────────────────────
// Gemini prompt — single call, full dossier output.
// ─────────────────────────────────────────────────────────────────

function buildPrompt(
  body: DossierReq,
  candidates: CandidateBundle[],
  pool: TwinPool
): string {
  const paralympicFirst = !!body.formData.has_impairment;
  const userSports = body.formData.sports ?? [];
  const userSportsLower = userSports.map((s) => s.toLowerCase());

  function sportOverlap(a: Athlete): boolean {
    if (userSportsLower.length === 0) return false;
    const aSport = a.sport.toLowerCase();
    const aEvent = (a.event ?? "").toLowerCase();
    return userSportsLower.some(
      (s) => aSport.includes(s) || aEvent.includes(s) || s.includes(aSport)
    );
  }

  function poolLine(a: Athlete, code: string, i: number): string {
    const h = a.height_cm ?? "?";
    const w = a.weight_kg ?? "?";
    const overlap = sportOverlap(a) ? "YES" : "no";
    return `    [${i}] code="${code}" sport="${a.sport}" event="${a.event}" year=${a.year} archetype=${a.archetype_id ?? "?"} h=${h} w=${w} sport_overlap=${overlap}`;
  }

  const olympicPoolLines = pool.olympic.map((a, i) => poolLine(a, pool.olympicCodes[i], i)).join("\n");
  const paralympicPoolLines = pool.paralympic.map((a, i) => poolLine(a, pool.paralympicCodes[i], i)).join("\n");

  const candidateBlocks = candidates
    .map((c) => {
      const a = ARCHETYPES.find((x) => x.id === c.id)!;
      const eraLines = c.eras
        .map(
          (s, i) =>
            `  ${i + 1}. ${s.year} — ${s.games} — ${s.sport} — ${s.pathway.toUpperCase()} — ${s.achievement}`
        )
        .join("\n");
      return `== Candidate id=${a.id} · ${a.name} ${a.emoji} (score ${c.score.score.toFixed(2)}, biometric_fit ${c.score.biometricFit.toFixed(2)}, signal_boost ${c.score.signalBoost.toFixed(2)}) ==
Tagline: ${a.tagline}
Default Olympic sport pool: ${a.olympicSports.join(", ")}
Default Paralympic sport pool: ${a.paralympicSports.join(", ")}
Ranker reasons: ${c.score.reasons.join("; ") || "—"}
Era anchors (use exactly, in this order):
${eraLines}`;
    })
    .join("\n\n");

  return `You are choosing a Team USA Athlete Archetype for a user AND writing their full corridor dossier in a single response.

USER PROFILE:
${JSON.stringify(body.formData, null, 2)}

CONVERSATION SUMMARY: ${body.conversationSummary || "(none)"}

USER'S SELECTED SPORTS: ${userSports.length ? userSports.join(", ") : "(none)"}
PARALYMPIC FIRST: ${paralympicFirst}

You MUST pick exactly ONE archetype from this shortlist of three candidates:

${candidateBlocks}

OLYMPIC TWIN CANDIDATE POOL — pick 3 indices into this list (any archetype OK):
${olympicPoolLines || "  (pool empty)"}

PARALYMPIC TWIN CANDIDATE POOL — pick 3 indices into this list (any archetype OK):
${paralympicPoolLines || "  (pool empty)"}

TWIN SELECTION RULES:
- Output exactly 3 indices per pathway into "olympic_twin_indices" and "paralympic_twin_indices".
- Indices are zero-based and must be unique within each pathway.
- Priority order when picking:
   1. sport_overlap=YES — heavily favoured. If the user picked gymnastics, gymnastics cohorts beat random sprint cohorts even when the chosen archetype is REACTIVE SPEEDSTER.
   2. biometric closeness (rows are pre-sorted within sport-overlap and within bio-only tiers — lower index = closer).
   3. archetype alignment with the archetype you picked — soft tiebreaker.
- It is FINE to pick twins whose archetype_id differs from your picked archetype if their sport overlaps the user's sport more meaningfully.

PICKING RULES:
- Default to the top-ranked candidate.
- The ranker's "selected sport is a primary discipline" reason is the STRONGEST signal in the system. If one or more shortlisted candidates have that reason and the top-ranked candidate does NOT, pick the highest-ranked candidate that DOES — the user's actual trained sport beats biometric proxies like build or height.
- Conversation keywords (e.g. "explosive", "quickness") are TONE, not discipline. They describe HOW the user trains within their sport; they do NOT promote an archetype whose primaries don't include the user's sport. Example: a gymnast emphasising "explosive power" stays a Kinetic/Precision pick whose sports happen to include Vault and Power Tumbling — they do NOT become a Reactive Speedster sprinter just because they used the word "explosive".
- Override the ranker only when the conversation summary names a specific discipline outside the user's listed sports AND that discipline is a primary of a different shortlisted archetype.
- VERSATILE DYNAMO only when the user has genuine multi-event experience (3+ disciplines simultaneously at school+ level).

WRITING RULES:
- Conditional language ONLY: "could", "may", "historically associated with", "athletes with this profile have". Banned: "you will", "your performance", "you would", "guaranteed".
- Never name a specific past or present athlete. Refer to cohorts, rosters, the discipline, "athletes with this profile".
- For sport picks: you may surface specific events that align with the user's selected sports even if they aren't in the archetype's default pool, provided the event genuinely fits the archetype (e.g. for a gymnast classified as REACTIVE SPEEDSTER you may pick "Vault" or "Floor Exercise (Power Tumbling)" in place of "Table Tennis").
- archetype_motto must be unattributed first-person-plural ("we ..."), under 18 words, no quotation marks attributing to a person.
- Treat Olympic and Paralympic depth equally — same editorial voice, same length, no inspiration framing for Paralympic content.

ARCHETYPE COHERENCE — CRITICAL:
- Once you commit to "archetype_id", every subsequent field (archetype, tagline, intro, outro, athlete_story, sport blurbs, twin narratives, era narratives, mottos, cultural_context, takeaway) MUST reference ONLY that archetype.
- DO NOT mention the names of the other two shortlisted archetypes anywhere in the response.
- archetype_id and archetype name must match the picked candidate exactly.

Return STRICT JSON (no markdown fences, no commentary), matching this schema exactly:

{
  "archetype_id": <id of picked candidate>,
  "archetype": "<NAME — match the candidate exactly>",
  "tagline": "<the candidate's tagline, verbatim or refined>",
  "stats": { "power": 0-10, "endurance": 0-10, "precision": 0-10 },
  "reasoning": "<1-2 sentences: why this archetype was picked, conditional language>",
  "athlete_story": "<3-5 sentences framing the user's body type as aligned with Team USA athletes of this archetype, conditional language>",
  "olympic_sports": [
    { "name": "<sport or event>", "blurb": "<1-2 sentences>" },
    { "name": "...", "blurb": "..." },
    { "name": "...", "blurb": "..." }
  ],
  "paralympic_sports": [
    { "name": "...", "blurb": "..." },
    { "name": "...", "blurb": "..." },
    { "name": "...", "blurb": "..." }
  ],
  "olympic_twin_indices": [<int>, <int>, <int>],
  "paralympic_twin_indices": [<int>, <int>, <int>],
  "olympic_twin_narratives": [
    "<2 sentences for the FIRST chosen olympic twin (matching olympic_twin_indices[0])>",
    "<for olympic_twin_indices[1]>",
    "<for olympic_twin_indices[2]>"
  ],
  "paralympic_twin_narratives": [
    "<for paralympic_twin_indices[0]>",
    "<for paralympic_twin_indices[1]>",
    "<for paralympic_twin_indices[2]>"
  ],
  "intro": "<1 sentence opening the corridor, 40 words max>",
  "outro": "<1 sentence sending viewer forward, 30 words max>",
  "eras": [
    { "year": <number>, "narrative": "<2 sentences, 50-70 words>", "archetype_motto": "<short manifesto-line, first-person-plural, no quotes>", "cultural_context": "<1 sentence>", "takeaway": "<1 sentence>" }
  ]
}

The "eras" array MUST contain exactly one entry per era anchor of the PICKED archetype, in the same chronological order shown above, with matching "year" values.
`;
}

// ─────────────────────────────────────────────────────────────────
// Gemini response type + parse.
// ─────────────────────────────────────────────────────────────────

interface GeminiDossier {
  archetype_id: number;
  archetype: string;
  tagline: string;
  stats: { power: number; endurance: number; precision: number };
  reasoning: string;
  athlete_story: string;
  olympic_sports: { name: string; blurb: string }[];
  paralympic_sports: { name: string; blurb: string }[];
  olympic_twin_indices: number[];
  paralympic_twin_indices: number[];
  olympic_twin_narratives: string[];
  paralympic_twin_narratives: string[];
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

// ─────────────────────────────────────────────────────────────────
// Assembly — merge Gemini output into final wire response.
// ─────────────────────────────────────────────────────────────────

function assembleResponse(
  body: DossierReq,
  picked: CandidateBundle,
  gem: GeminiDossier,
  user: UserBiometrics,
  pool: TwinPool
): DossierResponse {
  const archetypeMeta = ARCHETYPES.find((x) => x.id === picked.id)!;
  const paralympicFirst = !!body.formData.has_impairment;

  const olympic_sports = gem.olympic_sports.map((s) => ({
    name: s.name,
    blurb: s.blurb,
    match_percent: computeSportMatchPercent(
      user,
      SPORT_CENTROIDS[s.name] ?? ARCHETYPE_CENTROIDS[picked.id]
    ),
    pathway: "olympic" as const,
  }));
  const paralympic_sports = gem.paralympic_sports.map((s) => ({
    name: s.name,
    blurb: s.blurb,
    match_percent: computeSportMatchPercent(
      user,
      SPORT_CENTROIDS[s.name] ?? ARCHETYPE_CENTROIDS[picked.id]
    ),
    pathway: "paralympic" as const,
  }));

  const classification: ClassificationResult = {
    archetype: archetypeMeta.name,
    archetype_id: archetypeMeta.id,
    // Pin tagline from archetype meta — Gemini sometimes truncates or
    // returns the wrong-archetype tagline mid-generation.
    tagline: archetypeMeta.tagline,
    stats: gem.stats,
    olympic_sports,
    paralympic_sports,
    reasoning: gem.reasoning,
    athlete_story: gem.athlete_story,
    paralympic_first: paralympicFirst,
  };

  // Resolve Gemini's indices into the unified candidate pool. Filter out
  // out-of-range or duplicate picks, then top up from the pool front to
  // guarantee exactly 3 entries per pathway.
  function resolveIndices(
    raw: number[] | undefined,
    poolLen: number
  ): number[] {
    const seen = new Set<number>();
    const out: number[] = [];
    for (const i of raw ?? []) {
      if (Number.isInteger(i) && i >= 0 && i < poolLen && !seen.has(i)) {
        seen.add(i);
        out.push(i);
      }
      if (out.length === 3) return out;
    }
    for (let i = 0; out.length < 3 && i < poolLen; i++) {
      if (!seen.has(i)) {
        seen.add(i);
        out.push(i);
      }
    }
    return out;
  }

  const olympicIdx = resolveIndices(gem.olympic_twin_indices, pool.olympic.length);
  const paralympicIdx = resolveIndices(gem.paralympic_twin_indices, pool.paralympic.length);

  function toTwin(
    a: Athlete,
    code: string,
    narrative: string | undefined,
    pathway: "olympic" | "paralympic"
  ): TwinAthlete {
    return {
      code,
      sport: a.sport,
      event: a.event,
      year: a.year,
      games: a.games,
      medal: a.medal,
      height_cm: a.height_cm,
      weight_kg: a.weight_kg,
      similarity_percent: computeSportMatchPercent(user, [
        a.height_cm ?? 178,
        a.weight_kg ?? 75,
        (a.height_cm ?? 178) * 1.02,
        (a.weight_kg ?? 75) / Math.pow((a.height_cm ?? 178) / 100, 2),
      ]),
      dna_connection:
        narrative ??
        `The ${code} cohort carries Team USA representation in ${a.event}. Athletes with this profile have aligned with this archetype's biometric cluster across the program's record.`,
      pathway,
    };
  }

  const olympicTwins: TwinAthlete[] = olympicIdx.map((idx, i) =>
    toTwin(pool.olympic[idx], pool.olympicCodes[idx], gem.olympic_twin_narratives?.[i], "olympic")
  );
  const paralympicTwins: TwinAthlete[] = paralympicIdx.map((idx, i) =>
    toTwin(
      pool.paralympic[idx],
      pool.paralympicCodes[idx],
      gem.paralympic_twin_narratives?.[i],
      "paralympic"
    )
  );

  // Eras — match Gemini's entries to seed list by year. Seed list is authoritative
  // for year/games/city/pathway/sport/achievement. Gemini contributes narrative
  // bundle only.
  const byYear = new Map(gem.eras.map((e) => [e.year, e]));
  const eras: Era[] = picked.eras.map((seed) => {
    const enriched = byYear.get(seed.year);
    const decade = `${Math.floor(seed.year / 10) * 10}s`;
    if (!enriched) {
      return {
        ...seed,
        decade,
        ...fallbackEraNarrative(seed, archetypeMeta.name),
      };
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

  const eraWalk: EraWalkData = {
    archetype_id: archetypeMeta.id,
    archetype_name: archetypeMeta.name,
    signature_color: archetypeMeta.color,
    intro: gem.intro,
    outro: gem.outro,
    eras,
  };

  return {
    classification,
    eraWalk,
    twins: { olympic: olympicTwins, paralympic: paralympicTwins },
  };
}

// ─────────────────────────────────────────────────────────────────
// Deterministic fallback — used when Gemini fails or quota out.
// ─────────────────────────────────────────────────────────────────

function fallbackEraNarrative(
  seed: Pick<Era, "year" | "games" | "city" | "pathway" | "sport" | "achievement">,
  archetypeName: string
): Pick<Era, "narrative" | "archetype_motto" | "cultural_context" | "takeaway"> {
  return {
    narrative: `In ${seed.year}, the ${archetypeName} profile defined ${seed.sport.toLowerCase()} at ${seed.games}. ${seed.achievement}. Athletes with this archetype historically converged on this discipline because the body's natural levers aligned with what the sport demanded.`,
    archetype_motto: `We arrive ready and leave first.`,
    cultural_context: `This moment shaped how Team USA approached ${seed.sport.toLowerCase()} for the decades that followed.`,
    takeaway: `Profiles with this archetype have historically aligned with this kind of breakthrough.`,
  };
}

function deterministicDossier(
  body: DossierReq,
  picked: CandidateBundle,
  user: UserBiometrics,
  pool: TwinPool
): DossierResponse {
  const archetypeMeta = ARCHETYPES.find((x) => x.id === picked.id)!;
  const paralympicFirst = !!body.formData.has_impairment;

  const olympic_sports = archetypeMeta.olympicSports.slice(0, 3).map((s) => ({
    name: s,
    blurb: `Athletes with the ${archetypeMeta.name} profile have historically been represented in ${s} on Team USA rosters.`,
    match_percent: computeSportMatchPercent(
      user,
      SPORT_CENTROIDS[s] ?? ARCHETYPE_CENTROIDS[picked.id]
    ),
    pathway: "olympic" as const,
  }));
  const paralympic_sports = archetypeMeta.paralympicSports.slice(0, 3).map((s) => ({
    name: s,
    blurb: `Para-athletes with this profile have historically aligned with ${s}.`,
    match_percent: computeSportMatchPercent(
      user,
      SPORT_CENTROIDS[s] ?? ARCHETYPE_CENTROIDS[picked.id]
    ),
    pathway: "paralympic" as const,
  }));

  const classification: ClassificationResult = {
    archetype: archetypeMeta.name,
    archetype_id: archetypeMeta.id,
    tagline: archetypeMeta.tagline,
    stats: archetypeMeta.stats,
    olympic_sports,
    paralympic_sports,
    reasoning:
      picked.score.reasons[0] ??
      `Biometric profile aligns with the ${archetypeMeta.name} centroid relative to other archetypes.`,
    athlete_story: archetypeMeta.tagline,
    paralympic_first: paralympicFirst,
  };

  // Deterministic: take the front 3 of the pool — already pre-sorted by
  // sport-overlap then biometric distance. So fallback also gets the user's
  // sport context, not random archetype-tagged athletes.
  function toTwin(
    a: Athlete,
    code: string,
    pathway: "olympic" | "paralympic"
  ): TwinAthlete {
    return {
      code,
      sport: a.sport,
      event: a.event,
      year: a.year,
      games: a.games,
      medal: a.medal,
      height_cm: a.height_cm,
      weight_kg: a.weight_kg,
      similarity_percent: computeSportMatchPercent(user, [
        a.height_cm ?? 178,
        a.weight_kg ?? 75,
        (a.height_cm ?? 178) * 1.02,
        (a.weight_kg ?? 75) / Math.pow((a.height_cm ?? 178) / 100, 2),
      ]),
      dna_connection: `The ${code} cohort carries Team USA representation in ${a.event}. Athletes with this profile have aligned with this archetype's biometric cluster across the program's record.`,
      pathway,
    };
  }

  const olympicTwins: TwinAthlete[] = pool.olympic
    .slice(0, 3)
    .map((a, i) => toTwin(a, pool.olympicCodes[i], "olympic"));
  const paralympicTwins: TwinAthlete[] = pool.paralympic
    .slice(0, 3)
    .map((a, i) => toTwin(a, pool.paralympicCodes[i], "paralympic"));

  const eras: Era[] = picked.eras.map((seed) => ({
    ...seed,
    decade: `${Math.floor(seed.year / 10) * 10}s`,
    ...fallbackEraNarrative(seed, archetypeMeta.name),
  }));

  const eraWalk: EraWalkData = {
    archetype_id: archetypeMeta.id,
    archetype_name: archetypeMeta.name,
    signature_color: archetypeMeta.color,
    intro: `Walk the corridor of ${archetypeMeta.name} history. Six moments — Olympic and Paralympic — where this archetype shaped Team USA across nearly a century.`,
    outro: `The corridor continues. Athletes with your archetype have written six moments here — the next one waits to be written.`,
    eras,
  };

  return {
    classification,
    eraWalk,
    twins: { olympic: olympicTwins, paralympic: paralympicTwins },
  };
}

// ─────────────────────────────────────────────────────────────────
// Handler.
// ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: DossierReq;
  try {
    body = (await req.json()) as DossierReq;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const userBiometrics: UserBiometrics = {
    height_cm: body.formData.height_cm ?? 178,
    weight_kg: body.formData.weight_kg ?? 75,
    arm_span_cm: body.formData.arm_span_cm ?? body.formData.height_cm ?? 178,
  };

  const ranking = rankArchetypes(userBiometrics, body.formData, body.conversationSummary);
  const shortlist = ranking.slice(0, 3);

  console.log(
    `[DOSSIER] ranker top-5: ${ranking
      .slice(0, 5)
      .map((r) => `${r.id}=${r.score.toFixed(2)}`)
      .join(", ")}`
  );

  const olympicAth = loadOlympicAthletes();
  const paralympicAth = loadParalympicAthletes();
  const paralympicFirst = !!body.formData.has_impairment;

  const candidates: CandidateBundle[] = shortlist.map((s) => preloadCandidate(s, paralympicFirst));
  const pool = buildTwinPools(body, olympicAth, paralympicAth);

  // Fast-path fallback if no API key configured at all
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(deterministicDossier(body, candidates[0], userBiometrics, pool));
  }

  let parsed: GeminiDossier | null = null;
  try {
    const model = getFlashModel();
    const result = await withGeminiRetry(
      () => model.generateContent(buildPrompt(body, candidates, pool)),
      "dossier"
    );
    parsed = JSON.parse(result.response.text()) as GeminiDossier;
  } catch (e) {
    const wasQuota = logIfQuotaError(e, "dossier");
    if (!wasQuota) {
      console.error("[DOSSIER] Gemini call failed (non-quota):", e);
    }
    return NextResponse.json(deterministicDossier(body, candidates[0], userBiometrics, pool));
  }

  // Validate Gemini picked an id from the shortlist — if not, clamp to top.
  const allowedIds = new Set(candidates.map((c) => c.id));
  let pickedBundle = candidates.find((c) => c.id === parsed!.archetype_id);
  if (!pickedBundle) {
    console.warn(
      `[DOSSIER] Gemini picked ${parsed.archetype_id} outside shortlist [${[...allowedIds].join(",")}] — clamping to top.`
    );
    pickedBundle = candidates[0];
    parsed.archetype_id = pickedBundle.id;
    const meta = ARCHETYPES.find((x) => x.id === pickedBundle!.id)!;
    parsed.archetype = meta.name;
    parsed.tagline = meta.tagline;
  }

  try {
    return NextResponse.json(assembleResponse(body, pickedBundle, parsed, userBiometrics, pool));
  } catch (e) {
    console.error("[DOSSIER] assembly failed:", e);
    return NextResponse.json(deterministicDossier(body, pickedBundle, userBiometrics, pool));
  }
}
