// Licensed under the Apache License, Version 2.0
import { ARCHETYPE_CENTROIDS } from "./archetypes";
import { ARCHETYPES, type ArchetypeId } from "./constants";
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

// Returns true if any of the user's selected sports substring-matches an entry
// in the archetype's hard primary list (olympicSports + paralympicSports).
// e.g. user "Gymnastics" matches archetype 3's "Artistic Gymnastics" and
// archetype 7's "Rhythmic Gymnastics" — but NOT archetype 6 (Speedster) which
// only lists 100m/200m/Long Jump etc. Used as a heavily-weighted boost so an
// explicit sport choice dominates biometric drift.
function primarySportMatch(id: ArchetypeId, userSports: string[]): string[] {
  const arch = ARCHETYPES.find((a) => a.id === id);
  if (!arch) return [];
  const primaries = [...arch.olympicSports, ...arch.paralympicSports].map((s) => s.toLowerCase());
  const matched: string[] = [];
  for (const us of userSports) {
    const u = us.toLowerCase();
    if (primaries.some((p) => p.includes(u) || u.includes(p))) matched.push(us);
  }
  return matched;
}

export function rankArchetypes(
  user: UserBiometrics,
  form: Partial<FormData>,
  summary?: string
): ArchetypeScore[] {
  const userVec = toBiometricVector(user);
  const hasImpairment = !!form.has_impairment;
  const summaryLower = (summary ?? "").toLowerCase();

  const raw = ALL_IDS.map<ArchetypeScore>((id) => {
    // Biometric closeness — lower distance → higher fit. Map 0..0.6 → 1..0,
    // then halve so biometrics cap at 0.5. Lets a strong sport signal (up to
    // ~0.7 combined primary+adjacent) outweigh even a perfect biometric fit.
    const dist = scaledDistance(userVec, ARCHETYPE_CENTROIDS[id]);
    const biometricFit = Math.max(0, 1 - dist / 0.6) * 0.5;
    const reasons: string[] = [];

    let signalBoost = 0;

    // Primary sport match — user's selected sport is on the archetype's hard
    // primary discipline list. Biggest sport signal: a gymnast hits Precision
    // (Artistic Gymnastics) and Kinetic (Rhythmic Gymnastics), not Speedster.
    // Weight chosen so a primary match alone (+0.5) outranks a perfect
    // biometric fit (capped at +0.5) even with the build/HR boosts on top.
    const primaryMatched = primarySportMatch(id, form.sports ?? []);
    if (primaryMatched.length > 0) {
      signalBoost += 0.5;
      reasons.push(
        `selected sport "${primaryMatched.join(", ")}" is a primary discipline of this archetype`
      );
    }

    // Build signals — halved from prior values. Build is a biometric proxy,
    // so we keep its contribution well below the primary-sport signal. Sport
    // choice expresses intent; build expresses physiology — both matter, but
    // intent should win when the user has actually trained the discipline.
    const build = form.build;
    if (build === "broad_powerful" && (id === 1 || id === 5)) {
      signalBoost += 0.18; reasons.push("broad_powerful build aligns with throwers/grapplers");
    }
    if (build === "stocky" && (id === 1 || id === 5)) {
      signalBoost += 0.11; reasons.push("stocky build aligns with strength archetypes");
    }
    if (build === "lean" && (id === 2 || id === 6)) {
      signalBoost += 0.11; reasons.push("lean build aligns with endurance/sprint");
    }
    if (build === "tall_lean" && (id === 6 || id === 2)) {
      signalBoost += 0.1; reasons.push("tall_lean build aligns with sprinter/rower frame");
    }
    if (build === "athletic" && id === 4) {
      signalBoost += 0.03; reasons.push("athletic build mildly aligns with multi-event");
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

    // Adjacent sport signal — user's sport is in the archetype's loose
    // keyword bucket (multi-archetype mapping so gymnastics → vault=explosive,
    // rings=strength, tumbling=speed, floor=kinetic). Smaller boost than the
    // primary-match check above so a primary-list match always dominates.
    const sports = (form.sports ?? []).map((s) => s.toLowerCase());
    const sportHits = SPORT_TO_ARCHETYPE[id] ?? [];
    const matched = sports.filter((s) => sportHits.some((kw) => s.includes(kw)));
    if (matched.length > 0) {
      signalBoost += Math.min(0.2, matched.length * 0.1);
      reasons.push(`sport history (${matched.join(", ")}) adjacent to this archetype`);
    }

    // Conversation-summary keyword signals — picks up explicit intent the
    // user expressed during Gemini Q&A ("explosive power", "endurance", etc.)
    if (summaryLower) {
      const kwHits = SUMMARY_KEYWORDS[id] ?? [];
      const matchedKw = kwHits.filter((kw) => summaryLower.includes(kw));
      if (matchedKw.length > 0) {
        signalBoost += Math.min(0.4, matchedKw.length * 0.15);
        reasons.push(`conversation keywords (${matchedKw.join(", ")}) point to this archetype`);
      }
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

// Keyword fragments per archetype matched against form.sports[].
// Many sports legitimately fan into multiple archetypes (e.g. gymnastics, swimming,
// football, basketball). Listing them in every applicable bucket lets the ranker
// surface several viable archetypes for one sport — biometric distance + intent
// keywords then decide which fires.
const SPORT_TO_ARCHETYPE: Record<ArchetypeId, string[]> = {
  // Explosive Powerhouse — max force, short duration
  1: [
    "weightlifting", "shot put", "discus", "throw", "hammer", "javelin",
    "gymnastics", // vault, power tumbling
    "football", // line play
    "rugby",
    "baseball", // bat speed / pitching
    "boxing",
    "powerlifting",
  ],
  // Aerobic Engine — sustained output
  2: [
    "running", "marathon", "cycling", "triathlon", "rowing", "swimming",
    "skiing", "cross-country", "track & field", "track and field",
    "soccer", // midfield endurance
    "basketball", // full-court engine
  ],
  // Precision Artist — accuracy under pressure
  3: [
    "archery", "shooting", "fencing", "gymnastics", "skating", "figure skating",
    "golf", "table tennis", "darts", "billiards", "bowling",
    "tennis", // technical control
  ],
  // Versatile Dynamo — multi-event athletes
  4: [
    "track & field", "track and field", "decathlon", "heptathlon", "pentathlon",
    "triathlon", "modern pentathlon",
    "soccer", "basketball", "football", // multi-skill team sports
    "crossfit",
  ],
  // Strength Anchor — grappling, contact
  5: [
    "wrestling", "judo", "rugby", "boxing", "martial arts", "jiu-jitsu", "bjj",
    "mma", "football", "powerlifting", "strongman",
    "rowing", // anchor seat physicality
  ],
  // Reactive Speedster — first-step quickness
  6: [
    "sprint", "100m", "200m", "long jump", "triple jump",
    "table tennis", "badminton",
    "basketball", "soccer", "football", "baseball", "hockey", "lacrosse",
    "skating", "speed skating",
    "tennis", // explosive change of direction
    "gymnastics", // tumbling / sprint vault runway
    "volleyball",
  ],
  // Kinetic Controller — body in air, flow
  7: [
    "diving", "equestrian", "sailing", "skating", "figure skating", "gymnastics",
    "climbing", "surfing", "snowboarding", "skateboarding", "ski jumping",
    "trampoline", "dance", "cheerleading", "synchronized swimming", "artistic swimming",
    "yoga", "pilates",
  ],
  // Adaptive Warrior — gated by impairment, not sport history
  8: [],
};

// Keyword fragments per archetype matched against the lower-cased conversation
// summary. Lets explicit user intent ("explosive power", "endurance") override
// otherwise dominant biometric distance.
const SUMMARY_KEYWORDS: Record<ArchetypeId, string[]> = {
  1: ["explosive", "power", "throw", "heavy lift", "shot put", "discus", "max strength", "powerlifting", "olympic lift"],
  2: ["endurance", "aerobic", "long distance", "marathon", "cardio", "stamina", "vo2", "tempo run", "triathlon"],
  3: ["precision", "accuracy", "aim", "calm under pressure", "fine motor", "archery", "shooting"],
  4: ["multi-event", "decathlon", "heptathlon", "versatile", "all-around", "well-rounded", "balanced athlete"],
  5: ["grappling", "wrestling", "judo", "anchor", "hold", "leverage", "contact strength", "strongman"],
  6: ["sprint", "fast twitch", "reactive", "burst", "acceleration", "first step", "quickness"],
  7: ["kinetic", "body control", "tumbling", "rotational", "aerial", "graceful", "flow", "rhythm"],
  8: ["adaptive", "para", "wheelchair", "prosthetic", "amputee", "impairment", "blind sport"],
};
