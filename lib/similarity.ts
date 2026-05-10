// Licensed under the Apache License, Version 2.0
import { ARCHETYPE_CENTROIDS } from "./archetypes";
import type { ArchetypeId } from "./constants";
import type { FormData } from "@/store/athleteStore";

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export interface UserBiometrics {
  height_cm: number;
  weight_kg: number;
  arm_span_cm: number;
}

function toBiometricVector(b: UserBiometrics): number[] {
  const bmi = b.weight_kg / Math.pow(b.height_cm / 100, 2);
  return [b.height_cm, b.weight_kg, b.arm_span_cm, bmi];
}

// Feature-scaled L2 distance — each component divided by its typical range so
// they contribute on equal footing (raw cosine on biometrics is always > 0.995
// because all features sit in the same order of magnitude → useless).
const FEATURE_SCALES = [40, 60, 40, 15]; // height range, weight range, armspan range, bmi range
function scaledDistance(a: number[], b: number[]): number {
  let acc = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] - b[i]) / FEATURE_SCALES[i];
    acc += d * d;
  }
  return Math.sqrt(acc);
}

export function computeSportMatchPercent(user: UserBiometrics, centroid: number[]): number {
  const userVec = toBiometricVector(user);
  const sim = cosineSimilarity(userVec, centroid);
  // Cosine similarity between biometric vectors is always high (same order of magnitude)
  // Map 0.995–1.0 range → 70–99% match percent
  const pct = Math.round(70 + (sim - 0.995) / 0.005 * 29);
  return Math.max(60, Math.min(99, pct));
}

export function computeArchetypeMatchPercent(user: UserBiometrics, archetypeCentroid: number[]): number {
  return computeSportMatchPercent(user, archetypeCentroid);
}

// ─────────────────────────────────────────────────────────────────
// Ranker: blends biometric distance + form-data signals to score
// each archetype, returns ordered list. Used by /api/classify to
// deterministically shortlist top-3 candidates before Gemini picks.
// ─────────────────────────────────────────────────────────────────

export interface ArchetypeScore {
  id: ArchetypeId;
  score: number; // higher = better fit. Composite of biometric closeness + form signals.
  biometricFit: number; // 0..1
  signalBoost: number; // additive
  reasons: string[];
}

const ALL_IDS: ArchetypeId[] = [1, 2, 3, 4, 5, 6, 7, 8];

export function rankArchetypes(user: UserBiometrics, form: Partial<FormData>): ArchetypeScore[] {
  const userVec = toBiometricVector(user);
  const hasImpairment = !!form.has_impairment;

  const raw = ALL_IDS.map<ArchetypeScore>((id) => {
    // Biometric closeness — lower distance → higher fit. Map 0..0.6 → 1..0.
    const dist = scaledDistance(userVec, ARCHETYPE_CENTROIDS[id]);
    const biometricFit = Math.max(0, 1 - dist / 0.6);
    const reasons: string[] = [];

    let signalBoost = 0;

    // Build signals
    const build = form.build;
    if (build === "broad_powerful" && (id === 1 || id === 5)) {
      signalBoost += 0.18; reasons.push("broad_powerful build aligns with throwers/grapplers");
    }
    if (build === "stocky" && (id === 1 || id === 5)) {
      signalBoost += 0.12; reasons.push("stocky build aligns with strength archetypes");
    }
    if (build === "lean" && (id === 2 || id === 6)) {
      signalBoost += 0.16; reasons.push("lean build aligns with endurance/sprint");
    }
    if (build === "tall_lean" && (id === 6 || id === 2)) {
      signalBoost += 0.14; reasons.push("tall_lean build aligns with sprinter/rower frame");
    }
    if (build === "athletic" && id === 4) {
      signalBoost += 0.06; reasons.push("athletic build mildly aligns with multi-event");
    }

    // Flexibility signals — Precision + Kinetic
    if (form.flexibility === "hypermobile" && (id === 3 || id === 7)) {
      signalBoost += 0.2; reasons.push("hypermobile flexibility points to precision/kinetic");
    }
    if (form.flexibility === "above_average" && (id === 3 || id === 7)) {
      signalBoost += 0.1; reasons.push("above-average flexibility supports precision/kinetic");
    }
    if (form.flexibility === "limited" && (id === 1 || id === 5)) {
      signalBoost += 0.05; reasons.push("limited flexibility consistent with mass-dominant archetypes");
    }

    // Heart rate signals — endurance hint
    if (form.resting_hr === "athlete" && id === 2) {
      signalBoost += 0.12; reasons.push("athlete-tier resting HR aligns with aerobic engine");
    }
    if (form.resting_hr === "low" && id === 2) {
      signalBoost += 0.06;
    }

    // Sport history signals — boost archetypes whose primary sports overlap user's history
    const sports = (form.sports ?? []).map((s) => s.toLowerCase());
    const sportHits = SPORT_TO_ARCHETYPE[id] ?? [];
    const matched = sports.filter((s) => sportHits.some((kw) => s.includes(kw)));
    if (matched.length > 0) {
      signalBoost += Math.min(0.25, matched.length * 0.1);
      reasons.push(`sport history (${matched.join(", ")}) matches archetype primaries`);
    }

    // Active years × competition level — depth of training
    const compLevelBoost: Record<string, number> = {
      recreational: 0,
      school: 0.02,
      club: 0.04,
      varsity: 0.06,
      elite: 0.1,
    };
    if (form.competition_level) signalBoost += compLevelBoost[form.competition_level] ?? 0;

    // Adaptive Warrior gating — only viable when impairment present
    if (id === 8) {
      if (!hasImpairment) {
        // Heavily downweight; don't return -infinity, keep deterministic ordering
        signalBoost -= 0.5;
        reasons.push("no impairment → ADAPTIVE WARRIOR not viable");
      } else {
        signalBoost += 0.25;
        reasons.push("impairment present → ADAPTIVE WARRIOR viable");
      }
    }

    // Versatile Dynamo penalty — make it commit. Only the top-tier balanced
    // profile (athletic build + 2+ sports + varsity+) wins via tiebreak.
    if (id === 4) {
      const versatilitySignal =
        (build === "athletic" ? 0.06 : 0) +
        (sports.length >= 3 ? 0.06 : 0) +
        (form.competition_level === "varsity" || form.competition_level === "elite" ? 0.04 : 0);
      signalBoost += versatilitySignal - 0.1; // base penalty unless multiple signals stack
      if (versatilitySignal < 0.1) reasons.push("Dynamo penalised — needs explicit multi-event signal");
    }

    return {
      id,
      score: biometricFit + signalBoost,
      biometricFit,
      signalBoost,
      reasons,
    };
  });

  return raw.sort((a, b) => b.score - a.score);
}

// Keyword fragments per archetype matched against form.sports[]
const SPORT_TO_ARCHETYPE: Record<ArchetypeId, string[]> = {
  1: ["weightlifting", "shot put", "discus", "throw", "hammer", "javelin"],
  2: ["running", "marathon", "cycling", "triathlon", "rowing", "swimming", "skiing"],
  3: ["archery", "shooting", "fencing", "gymnastics", "skating"],
  4: ["track & field", "track and field", "decathlon", "heptathlon", "pentathlon"],
  5: ["wrestling", "judo", "rugby", "boxing", "martial arts"],
  6: ["sprint", "100m", "200m", "long jump", "triple jump", "table tennis", "badminton"],
  7: ["diving", "equestrian", "sailing", "skating", "gymnastics", "climbing"],
  8: [], // Adaptive Warrior — gated by impairment, not sport history
};
