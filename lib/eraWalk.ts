// Licensed under the Apache License, Version 2.0
import type { ArchetypeId } from "./constants";

export interface Era {
  year: number;
  decade: string;
  games: string;
  city: string;
  pathway: "olympic" | "paralympic";
  sport: string;
  achievement: string;
  narrative: string;
  archetype_motto: string;
  cultural_context: string;
  takeaway: string;
}

export interface EraWalkData {
  archetype_id: number;
  archetype_name: string;
  signature_color: string;
  intro: string;
  outro: string;
  eras: Era[];
}

// Hand-authored seed history per archetype — Gemini enriches narrative around
// these anchors. Each archetype has 3 Olympic + 3 Paralympic anchors arranged
// chronologically. Corridor renderer alternates O/P presentation at runtime.
// ADAPTIVE WARRIOR is Paralympic-only by design (no Olympic primaries).
//
// IMPORTANT: no athlete names. Anchors describe the *moment* (year, games,
// discipline, achievement at a cohort/discipline level) — never the person.
export const ERA_SEEDS: Record<ArchetypeId, Array<Pick<Era, "year" | "games" | "city" | "pathway" | "sport" | "achievement">>> = {
  1: [
    { year: 1956, games: "Melbourne 1956", city: "Melbourne", pathway: "olympic", sport: "Shot Put", achievement: "Throwing technique revolutionised; the 180° glide enters the sport" },
    { year: 1968, games: "Mexico City 1968", city: "Mexico City", pathway: "olympic", sport: "Discus Throw", achievement: "Team USA discus gold during a four-Games dynasty in the event" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "Discus F44", achievement: "Paralympic discus gold paired with a new world-record mark" },
    { year: 2016, games: "Rio 2016 Paralympics", city: "Rio de Janeiro", pathway: "paralympic", sport: "Discus F44", achievement: "Paralympic discus title defended across two consecutive Games" },
    { year: 2020, games: "Tokyo 2020 Paralympics", city: "Tokyo", pathway: "paralympic", sport: "Shot Put F41", achievement: "Paralympic shot put silver and a new American record" },
    { year: 2024, games: "Paris 2024", city: "Paris", pathway: "olympic", sport: "Shot Put", achievement: "Third straight Olympic gold; the world record rewritten in the same cycle" },
  ],
  2: [
    { year: 1972, games: "Munich 1972", city: "Munich", pathway: "olympic", sport: "Marathon", achievement: "Team USA marathon gold ignites a national running boom" },
    { year: 1984, games: "Los Angeles 1984", city: "Los Angeles", pathway: "olympic", sport: "Marathon", achievement: "The first-ever Olympic women's marathon, taken by Team USA" },
    { year: 1992, games: "Barcelona 1992 Paralympics", city: "Barcelona", pathway: "paralympic", sport: "Wheelchair Marathon", achievement: "Paralympic wheelchair-marathon gold with multi-year course dominance" },
    { year: 2012, games: "London 2012 Paralympics", city: "London", pathway: "paralympic", sport: "Handcycle (H4)", achievement: "Multi-Games Paralympic handcycle medals representing Team USA" },
    { year: 2016, games: "Rio 2016", city: "Rio de Janeiro", pathway: "olympic", sport: "Cycling (Time Trial)", achievement: "Third Olympic time-trial gold inside a decade for Team USA cycling" },
    { year: 2024, games: "Paris 2024 Paralympics", city: "Paris", pathway: "paralympic", sport: "Para-Triathlon (PT4)", achievement: "Repeat Paralympic gold across two consecutive cycles" },
  ],
  3: [
    { year: 1976, games: "Montreal 1976", city: "Montreal", pathway: "olympic", sport: "Shooting (50m Rifle)", achievement: "Team USA's first women's Olympic shooting medal" },
    { year: 1984, games: "Los Angeles 1984", city: "Los Angeles", pathway: "olympic", sport: "Archery (Recurve)", achievement: "Olympic recurve gold paired with a world record" },
    { year: 2004, games: "Athens 2004 Paralympics", city: "Athens", pathway: "paralympic", sport: "Para-Archery (Compound)", achievement: "Multiple Paralympic medals using the mouth-tab technique" },
    { year: 2016, games: "Rio 2016 Paralympics", city: "Rio de Janeiro", pathway: "paralympic", sport: "Para-Shooting (R3)", achievement: "Multi-Games Paralympic shooting medal haul" },
    { year: 2020, games: "Tokyo 2020 Paralympics", city: "Tokyo", pathway: "paralympic", sport: "Para-Archery (Compound W1)", achievement: "Paralympic archery medal shot foot-only" },
    { year: 2024, games: "Paris 2024", city: "Paris", pathway: "olympic", sport: "Artistic Gymnastics", achievement: "Team and all-around gold in a return-from-layoff Games" },
  ],
  4: [
    { year: 1948, games: "London 1948", city: "London", pathway: "olympic", sport: "Decathlon", achievement: "Decathlon gold taken by a teenage Team USA athlete" },
    { year: 1988, games: "Seoul 1988", city: "Seoul", pathway: "olympic", sport: "Heptathlon", achievement: "Heptathlon world record and long jump gold in the same Games" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "Para-Athletics (T44)", achievement: "Multi-event Paralympic medals across two cycles" },
    { year: 2012, games: "London 2012 Paralympics", city: "London", pathway: "paralympic", sport: "Sitting Volleyball", achievement: "Team USA Paralympic silver under captaincy from the back row" },
    { year: 2020, games: "Tokyo 2020", city: "Tokyo", pathway: "olympic", sport: "Decathlon", achievement: "Top-five Olympic decathlon finish reignites US depth in the event" },
    { year: 2024, games: "Paris 2024 Paralympics", city: "Paris", pathway: "paralympic", sport: "Sitting Volleyball", achievement: "Five-Games Paralympic veteran depth at Team USA's spine of the lineup" },
  ],
  5: [
    { year: 1952, games: "Helsinki 1952", city: "Helsinki", pathway: "olympic", sport: "Freestyle Wrestling", achievement: "Olympic freestyle gold at welterweight for Team USA" },
    { year: 1972, games: "Munich 1972", city: "Munich", pathway: "olympic", sport: "Freestyle Wrestling", achievement: "Olympic gold taken without surrendering a single point" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "Wheelchair Rugby", achievement: "Paralympic gold under Team USA captaincy" },
    { year: 2016, games: "Rio 2016 Paralympics", city: "Rio de Janeiro", pathway: "paralympic", sport: "Wheelchair Rugby", achievement: "Multi-Games Paralympic medals plus flagbearer honors" },
    { year: 2020, games: "Tokyo 2020", city: "Tokyo", pathway: "olympic", sport: "Freestyle Wrestling", achievement: "Olympic wrestling gold breaks a longstanding barrier for Team USA" },
    { year: 2024, games: "Paris 2024 Paralympics", city: "Paris", pathway: "paralympic", sport: "Para-Powerlifting", achievement: "Multiple American records inside one cycle for the program flagship" },
  ],
  6: [
    { year: 1936, games: "Berlin 1936", city: "Berlin", pathway: "olympic", sport: "100m / 200m / Long Jump", achievement: "Four-medal sprint sweep defying a hostile host regime" },
    { year: 1988, games: "Seoul 1988", city: "Seoul", pathway: "olympic", sport: "100m Sprint", achievement: "Women's 100m and 200m world records still unbroken decades on" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "T44 Sprint", achievement: "Paralympic sprint medals run on prosthetic blades" },
    { year: 2012, games: "London 2012 Paralympics", city: "London", pathway: "paralympic", sport: "T54 Wheelchair Sprint", achievement: "Multi-distance Paralympic gold rewrites wheelchair racing" },
    { year: 2020, games: "Tokyo 2020 Paralympics", city: "Tokyo", pathway: "paralympic", sport: "T64 100m Sprint", achievement: "Paralympic sprint medals run on dual prosthetic blades" },
    { year: 2024, games: "Paris 2024", city: "Paris", pathway: "olympic", sport: "100m Sprint", achievement: "Olympic 100m gold decided by the closest finish on record" },
  ],
  7: [
    { year: 1956, games: "Melbourne 1956", city: "Melbourne", pathway: "olympic", sport: "Diving (Platform)", achievement: "Double-double Olympic gold across two consecutive Games" },
    { year: 1984, games: "Los Angeles 1984", city: "Los Angeles", pathway: "olympic", sport: "Diving (10m Platform)", achievement: "Double-event diving gold setting a perfect-form benchmark" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "Para-Equestrian Dressage", achievement: "Five-Games Paralympic equestrian career launched here" },
    { year: 2016, games: "Rio 2016 Paralympics", city: "Rio de Janeiro", pathway: "paralympic", sport: "Para-Equestrian Dressage", achievement: "Multi-Games Paralympic dressage medal run begins" },
    { year: 2020, games: "Tokyo 2020 Paralympics", city: "Tokyo", pathway: "paralympic", sport: "Para-Equestrian Dressage Grade I", achievement: "Two Paralympic golds plus the first perfect-score test in the discipline" },
    { year: 2024, games: "Paris 2024", city: "Paris", pathway: "olympic", sport: "Diving (Synchronized 3m)", achievement: "Team USA's first synchronised springboard medal in sixteen years" },
  ],
  8: [
    { year: 1988, games: "Seoul 1988 Paralympics", city: "Seoul", pathway: "paralympic", sport: "Wheelchair Basketball", achievement: "Multi-Games Paralympic medal run shapes the modern US program" },
    { year: 2000, games: "Sydney 2000 Paralympics", city: "Sydney", pathway: "paralympic", sport: "Wheelchair Tennis", achievement: "Paralympic gold in quad doubles" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "Goalball", achievement: "Multiple Paralympic medals split across goalball and track" },
    { year: 2012, games: "London 2012 Paralympics", city: "London", pathway: "paralympic", sport: "Wheelchair Rugby", achievement: "Paralympic gold won by Team USA after a quad-amputee return" },
    { year: 2016, games: "Rio 2016 Paralympics", city: "Rio de Janeiro", pathway: "paralympic", sport: "Wheelchair Basketball", achievement: "Two consecutive Paralympic golds for the US women's program" },
    { year: 2024, games: "Paris 2024 Paralympics", city: "Paris", pathway: "paralympic", sport: "Wheelchair Tennis", achievement: "Multi-Games Paralympic veteran anchors the US wheelchair tennis squad" },
  ],
};

// Returns era seeds in alternating Olympic/Paralympic order. If paralympicFirst,
// Paralympic eras lead. ADAPTIVE WARRIOR (archetype 8) returns its all-Paralympic
// list as-is. Eras within each pathway are sorted chronologically.
export function alternateSeeds(archetypeId: ArchetypeId, paralympicFirst: boolean) {
  const seeds = ERA_SEEDS[archetypeId];
  if (!seeds) return [];
  if (archetypeId === 8) return [...seeds].sort((a, b) => a.year - b.year);
  const oly = seeds.filter((s) => s.pathway === "olympic").sort((a, b) => a.year - b.year);
  const para = seeds.filter((s) => s.pathway === "paralympic").sort((a, b) => a.year - b.year);
  const result: typeof seeds = [];
  const max = Math.max(oly.length, para.length);
  const first = paralympicFirst ? para : oly;
  const second = paralympicFirst ? oly : para;
  for (let i = 0; i < max; i++) {
    if (first[i]) result.push(first[i]);
    if (second[i]) result.push(second[i]);
  }
  return result;
}
