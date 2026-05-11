// Licensed under the Apache License, Version 2.0
import { NextResponse } from "next/server";
import { loadOlympicAthletes, loadParalympicAthletes, type Athlete } from "@/lib/dataLoader";
import { getFlashModel, logIfQuotaError } from "@/lib/gemini";
import { computeSportMatchPercent, type UserBiometrics } from "@/lib/similarity";

export const runtime = "nodejs";

interface TwinsReq {
  archetypeId: number;
  height: number;
  weight: number;
  sex: "male" | "female";
  paralympicFirst: boolean;
}

interface TwinResult {
  // No athlete names exposed to client. `code` is a cohort handle assembled
  // server-side from pathway · year · discipline · roster letter.
  code: string;
  sport: string;
  event: string;
  year: number;
  games: string;
  medal?: string;
  height_cm?: number;
  weight_kg?: number;
  similarity_percent: number;
  dna_connection: string;
  pathway: "olympic" | "paralympic";
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s|-|\/)/)
    .map((t) => (/^[a-z]/.test(t) ? t.charAt(0).toUpperCase() + t.slice(1) : t))
    .join("");
}

// Sport names that are IOC umbrella terms — too vague to read alone.
// For these, use the `event` field for the discipline label instead.
const GENERIC_SPORTS = new Set([
  "athletics",
  "aquatics",
  "cycling",
  "gymnastics",
  "para-athletics",
  "para athletics",
  "para-cycling",
  "para cycling",
  "para-swimming",
  "para swimming",
]);

function pickDiscipline(athlete: Athlete): string {
  const sportLower = athlete.sport.toLowerCase().trim();
  if (GENERIC_SPORTS.has(sportLower) && athlete.event) {
    return athlete.event;
  }
  return titleCase(athlete.sport);
}

// Human-readable cohort handle, name-free.
// e.g. "Olympic 100m Sprint 1996 (Gold)", "Paralympic Wheelchair Rugby 2016"
function buildCode(athlete: Athlete, pathway: "olympic" | "paralympic"): string {
  const pathway_label = pathway === "olympic" ? "Olympic" : "Paralympic";
  const discipline = pickDiscipline(athlete);
  const medalSuffix = athlete.medal ? ` (${athlete.medal})` : "";
  return `${pathway_label} ${discipline} ${athlete.year}${medalSuffix}`;
}

// If two cohorts in the same slice collapse to the same label
// (same sport + year + medal), append roman-numeral disambiguator.
function buildCodes(twins: Athlete[], pathway: "olympic" | "paralympic"): string[] {
  const counts = new Map<string, number>();
  const ROMAN = ["", " II", " III", " IV", " V", " VI"];
  const codes = twins.map((t) => buildCode(t, pathway));
  const out: string[] = [];
  codes.forEach((c) => {
    const n = counts.get(c) ?? 0;
    out.push(n === 0 ? c : `${c}${ROMAN[n] ?? ` (${n + 1})`}`);
    counts.set(c, n + 1);
  });
  return out;
}

function selectTwins(
  athletes: Athlete[],
  archetypeId: number,
  height: number,
  weight: number,
  sex: string,
  count: number
): Athlete[] {
  const sexCode = sex === "male" ? "M" : "F";

  // Tier 1: same archetype + same sex + tight biometrics
  const t1 = athletes.filter((a) =>
    a.archetype_id === archetypeId &&
    a.sex === sexCode &&
    (!a.height_cm || Math.abs(a.height_cm - height) <= 8) &&
    (!a.weight_kg || Math.abs(a.weight_kg - weight) <= 10)
  );
  if (t1.length >= count) return t1.slice(0, count);

  // Tier 2: same archetype + same sex + loose biometrics
  const t2 = athletes.filter((a) =>
    a.archetype_id === archetypeId &&
    a.sex === sexCode &&
    (!a.height_cm || Math.abs(a.height_cm - height) <= 15) &&
    (!a.weight_kg || Math.abs(a.weight_kg - weight) <= 20)
  );
  if (t2.length >= count) return t2.slice(0, count);

  // Tier 3: same archetype, any sex
  const t3 = athletes.filter((a) => a.archetype_id === archetypeId);
  if (t3.length >= count) return t3.slice(0, count);

  // Tier 4: any athlete with similar biometrics
  const t4 = athletes
    .filter((a) => a.sex === sexCode)
    .sort((a, b) => {
      const da = Math.abs((a.height_cm ?? 178) - height) + Math.abs((a.weight_kg ?? 75) - weight);
      const db = Math.abs((b.height_cm ?? 178) - height) + Math.abs((b.weight_kg ?? 75) - weight);
      return da - db;
    });
  return t4.slice(0, count);
}

async function generateConnections(
  twins: Athlete[],
  codes: string[],
  archetypeId: number,
  pathway: "olympic" | "paralympic"
): Promise<string[]> {
  if (twins.length === 0) return [];
  try {
    const model = getFlashModel();
    const anonymised = twins.map((t, i) => ({
      code: codes[i],
      sport: t.sport,
      event: t.event,
      year: t.year,
      games: t.games,
      height_cm: t.height_cm,
      weight_kg: t.weight_kg,
    }));
    const prompt = `Generate a 2-sentence "DNA connection" narrative for each Team USA roster cohort below, framed as biometric/archetype alignment with the user (archetype id ${archetypeId}).

CRITICAL ANONYMITY RULE: never name any athlete, past or present. Refer to each entry only by its "code" (e.g. "Olympic Swimming 2008 (Gold)") or by phrases like "this roster cohort", "the ${pathway} bracket", "athletes with this profile". Performance facts (medal, year, discipline) are fine.

USE conditional language ONLY: "could", "may", "historically associated with", "athletes with this profile have".
NEVER use "you will", "you would", "your performance".

Return ONLY a JSON array of strings in the same order as the input:
${JSON.stringify(anonymised, null, 2)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const arr = JSON.parse(text);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch (e) {
    if (!logIfQuotaError(e, "twins")) {
      console.error("[TWINS] narrative generation failed (non-quota):", e);
    }
    return twins.map(
      (t, i) =>
        `The ${codes[i]} cohort represents Team USA in ${t.sport}. Athletes with this biometric profile have historically aligned with this archetype's cluster across the program's record.`
    );
  }
}

function toTwinResult(
  athlete: Athlete,
  pathway: "olympic" | "paralympic",
  user: UserBiometrics,
  connection: string,
  code: string
): TwinResult {
  const centroid = [
    athlete.height_cm ?? 178,
    athlete.weight_kg ?? 75,
    (athlete.height_cm ?? 178) * 1.02,
    (athlete.weight_kg ?? 75) / Math.pow((athlete.height_cm ?? 178) / 100, 2),
  ];
  return {
    code,
    sport: athlete.sport,
    event: athlete.event,
    year: athlete.year,
    games: athlete.games,
    medal: athlete.medal,
    height_cm: athlete.height_cm,
    weight_kg: athlete.weight_kg,
    similarity_percent: computeSportMatchPercent(user, centroid),
    dna_connection: connection,
    pathway,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TwinsReq;
    const olympic = loadOlympicAthletes();
    const paralympic = loadParalympicAthletes();

    const olympicTwins = selectTwins(olympic, body.archetypeId, body.height, body.weight, body.sex, 3);
    const paralympicTwins = selectTwins(paralympic, body.archetypeId, body.height, body.weight, body.sex, 3);

    const olympicCodes = buildCodes(olympicTwins, "olympic");
    const paralympicCodes = buildCodes(paralympicTwins, "paralympic");

    // Generate connections in parallel for speed
    const [olympicConn, paralympicConn] = await Promise.all([
      generateConnections(olympicTwins, olympicCodes, body.archetypeId, "olympic"),
      generateConnections(paralympicTwins, paralympicCodes, body.archetypeId, "paralympic"),
    ]);

    const user: UserBiometrics = {
      height_cm: body.height,
      weight_kg: body.weight,
      arm_span_cm: body.height,
    };

    return NextResponse.json({
      olympic: olympicTwins.map((t, i) =>
        toTwinResult(
          t,
          "olympic",
          user,
          olympicConn[i] ??
            `The ${olympicCodes[i]} cohort carries Team USA representation in ${t.event}. Athletes with this profile have aligned with this archetype's biometric cluster across the program's record.`,
          olympicCodes[i]
        )
      ),
      paralympic: paralympicTwins.map((t, i) =>
        toTwinResult(
          t,
          "paralympic",
          user,
          paralympicConn[i] ??
            `The ${paralympicCodes[i]} cohort carries Team USA Paralympic representation in ${t.event}. Athletes with this profile have aligned with this archetype's biometric cluster across the program's record.`,
          paralympicCodes[i]
        )
      ),
    });
  } catch (e) {
    console.error("twins error", e);
    return NextResponse.json({ olympic: [], paralympic: [] });
  }
}
