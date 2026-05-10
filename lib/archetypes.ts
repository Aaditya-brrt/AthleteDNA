// Licensed under the Apache License, Version 2.0
import { ARCHETYPES, type ArchetypeId } from "./constants";

export type Archetype = (typeof ARCHETYPES)[number];

export function getArchetypeById(id: number): Archetype | undefined {
  return ARCHETYPES.find((a) => a.id === id);
}

export function getArchetypeColor(id: number): string {
  return getArchetypeById(id)?.color ?? "#f59e0b";
}

export function getArchetypeStats(id: number) {
  return getArchetypeById(id)?.stats ?? { power: 5, endurance: 5, precision: 5 };
}

// Biometric centroid vectors per archetype: [height_cm, weight_kg, arm_span_cm, bmi_proxy]
// Normalized approximate centroids derived from the archetype biometric signatures in CLAUDE.md
export const ARCHETYPE_CENTROIDS: Record<ArchetypeId, number[]> = {
  1: [178, 115, 181, 36.3],  // Explosive Powerhouse: shorter, very heavy, broad
  2: [175, 68,  178, 22.2],  // Aerobic Engine: lean, average height
  3: [165, 60,  166, 22.0],  // Precision Artist: average build, shorter
  4: [180, 78,  183, 24.1],  // Versatile Dynamo: balanced
  5: [172, 95,  174, 32.1],  // Strength Anchor: stocky, strong
  6: [185, 73,  191, 21.3],  // Reactive Speedster: tall, lean, long arms
  7: [163, 55,  164, 20.7],  // Kinetic Controller: lean, shorter
  8: [175, 75,  177, 24.5],  // Adaptive Warrior: varies — use balanced default
};

// Per-sport centroid vectors aligned with the archetype list
// [height_cm, weight_kg, arm_span_cm, bmi_proxy]
export const SPORT_CENTROIDS: Record<string, number[]> = {
  "Shot Put": [183, 125, 187, 37.3],
  "Discus Throw": [190, 115, 194, 31.9],
  "Weightlifting": [172, 105, 175, 35.5],
  "Marathon": [170, 59, 173, 20.4],
  "Triathlon": [178, 70, 181, 22.1],
  "Rowing": [192, 85, 196, 23.1],
  "Archery": [174, 72, 176, 23.8],
  "Artistic Gymnastics": [158, 52, 159, 20.8],
  "Decathlon": [185, 85, 188, 24.9],
  "Judo": [175, 90, 177, 29.4],
  "Freestyle Wrestling": [173, 88, 175, 29.4],
  "100m Sprint": [183, 77, 190, 23.0],
  "200m Sprint": [184, 75, 191, 22.1],
  "Long Jump": [185, 76, 192, 22.2],
  "Diving": [165, 58, 166, 21.3],
  "Equestrian": [167, 62, 168, 22.2],
  // Paralympic sports
  "Paralympic Powerlifting": [168, 95, 170, 33.6],
  "Shot Put (F40-F46)": [165, 95, 168, 35.0],
  "Handcycle (H-classes)": [0, 70, 0, 0],
  "Para-Triathlon": [175, 65, 178, 21.2],
  "Para-Archery": [175, 73, 177, 23.8],
  "Boccia": [170, 68, 171, 23.5],
  "Wheelchair Rugby": [178, 80, 182, 25.3],
  "Sprint Wheelchair Racing (T51-T54)": [180, 65, 184, 20.1],
  "Wheelchair Basketball": [182, 78, 185, 23.5],
  "Wheelchair Tennis": [183, 78, 188, 23.3],
  "Goalball": [175, 80, 178, 26.1],
};

export { ARCHETYPES };
