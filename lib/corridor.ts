// Licensed under the Apache License, Version 2.0
import type { Era } from "./eraWalk";
import type { ClassificationResult, FormData, TwinAthlete, SportMatch } from "@/store/athleteStore";

export type StageKind = "threshold" | "era" | "twins_hall" | "pathway" | "mirror_exit";

export interface ThresholdStage {
  kind: "threshold";
}

export interface EraStage {
  kind: "era";
  era: Era;
  /** 1-based index within the era set (1..6) */
  eraNumber: number;
}

export interface TwinsHallStage {
  kind: "twins_hall";
  olympic: TwinAthlete[];
  paralympic: TwinAthlete[];
}

export interface PathwayStage {
  kind: "pathway";
  olympic: SportMatch[];
  paralympic: SportMatch[];
}

export interface MirrorExitStage {
  kind: "mirror_exit";
}

export type Stage = ThresholdStage | EraStage | TwinsHallStage | PathwayStage | MirrorExitStage;

export interface CorridorPayload {
  archetypeId: number;
  archetypeName: string;
  signatureColor: string;
  paralympicFirst: boolean;
  classification: ClassificationResult;
  formData: Partial<FormData>;
  intro: string;
  outro: string;
  stages: Stage[];
}

export function buildStages(input: {
  classification: ClassificationResult;
  eras: Era[];
  twins: { olympic: TwinAthlete[]; paralympic: TwinAthlete[] } | null;
  paralympicFirst: boolean;
}): Stage[] {
  const stages: Stage[] = [{ kind: "threshold" }];
  input.eras.forEach((era, i) => {
    stages.push({ kind: "era", era, eraNumber: i + 1 });
  });
  if (input.twins) {
    stages.push({ kind: "twins_hall", olympic: input.twins.olympic, paralympic: input.twins.paralympic });
  }
  // Pathway room — equal sides; respect paralympicFirst by swapping at render time, not order.
  stages.push({
    kind: "pathway",
    olympic: input.classification.olympic_sports.slice(0, 3),
    paralympic: input.classification.paralympic_sports.slice(0, 3),
  });
  stages.push({ kind: "mirror_exit" });
  return stages;
}
