// Licensed under the Apache License, Version 2.0
import { readFileSync } from "fs";
import { join } from "path";

export interface Athlete {
  name: string;
  sex: "M" | "F";
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  sport: string;
  event: string;
  year: number;
  season: "Summer" | "Winter";
  medal?: "Gold" | "Silver" | "Bronze";
  games: string;
  archetype_id?: number;
  // Paralympic-only fields
  impairment_category?: string;
  ipc_classification?: string;
}

let _olympicAthletes: Athlete[] | null = null;
let _paralympicAthletes: Athlete[] | null = null;

export function loadOlympicAthletes(): Athlete[] {
  if (_olympicAthletes) return _olympicAthletes;
  const filePath = join(process.cwd(), "data", "usa_olympic_athletes.json");
  _olympicAthletes = JSON.parse(readFileSync(filePath, "utf-8")) as Athlete[];
  return _olympicAthletes;
}

export function loadParalympicAthletes(): Athlete[] {
  if (_paralympicAthletes) return _paralympicAthletes;
  const filePath = join(process.cwd(), "data", "usa_paralympic_athletes.json");
  _paralympicAthletes = JSON.parse(readFileSync(filePath, "utf-8")) as Athlete[];
  return _paralympicAthletes;
}

export function findTwins(
  athletes: Athlete[],
  height_cm: number,
  weight_kg: number,
  sex: string,
  targetSports: string[],
  maxResults: number = 3,
  strictMode = true
): Athlete[] {
  const hTol = strictMode ? 8 : 15;
  const wTol = strictMode ? 10 : 20;

  const matches = athletes.filter((a) => {
    if (sex && a.sex !== (sex === "male" ? "M" : "F")) return false;
    if (!targetSports.some((s) => a.sport.toLowerCase().includes(s.toLowerCase()))) {
      // Loosen sport match if no results
    }
    const hMatch = !a.height_cm || Math.abs(a.height_cm - height_cm) <= hTol;
    const wMatch = !a.weight_kg || Math.abs(a.weight_kg - weight_kg) <= wTol;
    return hMatch && wMatch;
  });

  if (matches.length >= maxResults) return matches.slice(0, maxResults);

  // Loosen constraints
  if (strictMode) return findTwins(athletes, height_cm, weight_kg, sex, targetSports, maxResults, false);
  return matches.slice(0, maxResults);
}
