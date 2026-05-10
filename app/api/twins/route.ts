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
  name: string;
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
  archetypeId: number
): Promise<string[]> {
  if (twins.length === 0) return [];
  try {
    const model = getFlashModel();
    const prompt = `Generate a 2-sentence "DNA connection" narrative for each Team USA athlete below, framed as biometric/archetype alignment with the user (archetype id ${archetypeId}).

USE conditional language ONLY: "could", "may", "historically associated with", "athletes with this profile have".
NEVER use "you will", "you would", "your performance".

Return ONLY a JSON array of strings in the same order:
${JSON.stringify(twins.map((t) => ({ name: t.name, sport: t.sport, event: t.event, height_cm: t.height_cm, weight_kg: t.weight_kg })), null, 2)}`;

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
      (t) =>
        `Athletes with this archetype profile have historically been represented in ${t.sport}. ${t.name}'s biometric range may align with the user's cluster across Team USA's record.`
    );
  }
}

function toTwinResult(
  athlete: Athlete,
  pathway: "olympic" | "paralympic",
  user: UserBiometrics,
  connection: string
): TwinResult {
  const centroid = [
    athlete.height_cm ?? 178,
    athlete.weight_kg ?? 75,
    (athlete.height_cm ?? 178) * 1.02,
    (athlete.weight_kg ?? 75) / Math.pow((athlete.height_cm ?? 178) / 100, 2),
  ];
  return {
    name: athlete.name,
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

    // Generate connections in parallel for speed
    const [olympicConn, paralympicConn] = await Promise.all([
      generateConnections(olympicTwins, body.archetypeId),
      generateConnections(paralympicTwins, body.archetypeId),
    ]);

    const user: UserBiometrics = {
      height_cm: body.height,
      weight_kg: body.weight,
      arm_span_cm: body.height,
    };

    return NextResponse.json({
      olympic: olympicTwins.map((t, i) =>
        toTwinResult(t, "olympic", user, olympicConn[i] ?? `${t.name} represented Team USA in ${t.event} — athletes with this profile have aligned with this archetype's biometric cluster.`)
      ),
      paralympic: paralympicTwins.map((t, i) =>
        toTwinResult(t, "paralympic", user, paralympicConn[i] ?? `${t.name} represented Team USA in ${t.event} — Paralympic athletes with this profile have aligned with this archetype's biometric cluster.`)
      ),
    });
  } catch (e) {
    console.error("twins error", e);
    return NextResponse.json({ olympic: [], paralympic: [] });
  }
}
