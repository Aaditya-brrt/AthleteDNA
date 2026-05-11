// Licensed under the Apache License, Version 2.0
// Shared twin-selection + cohort-code helpers, used by /api/dossier (live path)
// and /api/twins (legacy direct fetch — kept for backwards compatibility).
import type { Athlete } from "./dataLoader";

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s|-|\/)/)
    .map((t) => (/^[a-z]/.test(t) ? t.charAt(0).toUpperCase() + t.slice(1) : t))
    .join("");
}

// IOC umbrella terms that are too vague alone. For these, use the `event` field.
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

// "Olympic 100m Sprint 1996 (Gold)" / "Paralympic Wheelchair Rugby 2016"
export function buildCode(athlete: Athlete, pathway: "olympic" | "paralympic"): string {
  const pathway_label = pathway === "olympic" ? "Olympic" : "Paralympic";
  const discipline = pickDiscipline(athlete);
  const medalSuffix = athlete.medal ? ` (${athlete.medal})` : "";
  return `${pathway_label} ${discipline} ${athlete.year}${medalSuffix}`;
}

export function buildCodes(twins: Athlete[], pathway: "olympic" | "paralympic"): string[] {
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

// Build a unified candidate pool (sport-overlap first, biometric distance
// second, archetype-agnostic). Gemini sees this pool with stable indices and
// picks 3 by relevance. Lets a gymnast classified as Speedster surface
// gymnastics cohorts rather than the archetype's default sprint-only pool.
export function buildTwinPool(
  athletes: Athlete[],
  height: number,
  weight: number,
  sex: string,
  userSports: string[],
  poolSize: number = 8
): Athlete[] {
  const sexCode = sex === "male" ? "M" : "F";
  const userSportsLower = userSports.map((s) => s.toLowerCase()).filter(Boolean);

  function sportHit(a: Athlete): boolean {
    if (userSportsLower.length === 0) return false;
    const aSport = a.sport.toLowerCase();
    const aEvent = (a.event ?? "").toLowerCase();
    return userSportsLower.some(
      (s) => aSport.includes(s) || aEvent.includes(s) || s.includes(aSport)
    );
  }

  function bioDist(a: Athlete): number {
    const dh = Math.abs((a.height_cm ?? 178) - height);
    const dw = Math.abs((a.weight_kg ?? 75) - weight);
    return dh / 40 + dw / 60;
  }

  const sameSex = athletes.filter((a) => a.sex === sexCode);
  const sportPool = sameSex
    .filter(sportHit)
    .sort((a, b) => bioDist(a) - bioDist(b));
  const bioPool = sameSex
    .filter((a) => !sportHit(a))
    .sort((a, b) => bioDist(a) - bioDist(b));

  // Half the pool for sport overlaps, rest filled by biometric closeness.
  // If sport overlaps are scarce, biometric fills the gap.
  const sportTake = Math.min(sportPool.length, Math.ceil(poolSize / 2));
  return [
    ...sportPool.slice(0, sportTake),
    ...bioPool.slice(0, poolSize - sportTake),
  ];
}

// Legacy archetype-strict selection — kept for reference / fallback when the
// broader pool returns zero candidates. Filters by archetype + sex + biometrics
// in tiers, with sport-overlap reordering at each tier.
export function selectTwinsSportAware(
  athletes: Athlete[],
  archetypeId: number,
  height: number,
  weight: number,
  sex: string,
  userSports: string[],
  count: number
): Athlete[] {
  const sexCode = sex === "male" ? "M" : "F";
  const userSportsLower = userSports.map((s) => s.toLowerCase()).filter(Boolean);

  function sportRank(a: Athlete): number {
    if (userSportsLower.length === 0) return 0;
    const aSport = a.sport.toLowerCase();
    const aEvent = (a.event ?? "").toLowerCase();
    return userSportsLower.some(
      (s) => aSport.includes(s) || aEvent.includes(s) || s.includes(aSport)
    )
      ? 1
      : 0;
  }

  function sortBySport<T extends Athlete>(arr: T[]): T[] {
    return [...arr].sort((x, y) => sportRank(y) - sportRank(x));
  }

  // Tier 1: same archetype + same sex + tight biometrics
  let pool: Athlete[] = athletes.filter(
    (a) =>
      a.archetype_id === archetypeId &&
      a.sex === sexCode &&
      (!a.height_cm || Math.abs(a.height_cm - height) <= 8) &&
      (!a.weight_kg || Math.abs(a.weight_kg - weight) <= 10)
  );
  if (pool.length >= count) return sortBySport(pool).slice(0, count);

  // Tier 2: loose biometrics
  pool = athletes.filter(
    (a) =>
      a.archetype_id === archetypeId &&
      a.sex === sexCode &&
      (!a.height_cm || Math.abs(a.height_cm - height) <= 15) &&
      (!a.weight_kg || Math.abs(a.weight_kg - weight) <= 20)
  );
  if (pool.length >= count) return sortBySport(pool).slice(0, count);

  // Tier 3: archetype only
  pool = athletes.filter((a) => a.archetype_id === archetypeId);
  if (pool.length >= count) return sortBySport(pool).slice(0, count);

  // Tier 4: any same-sex athlete, ranked by biometric distance then sport overlap
  pool = athletes
    .filter((a) => a.sex === sexCode)
    .sort((a, b) => {
      const da = Math.abs((a.height_cm ?? 178) - height) + Math.abs((a.weight_kg ?? 75) - weight);
      const db = Math.abs((b.height_cm ?? 178) - height) + Math.abs((b.weight_kg ?? 75) - weight);
      return da - db;
    });
  return sortBySport(pool).slice(0, count);
}
