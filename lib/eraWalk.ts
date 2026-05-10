// Licensed under the Apache License, Version 2.0
import type { ArchetypeId } from "./constants";

export interface Era {
  year: number;
  decade: string;
  games: string;
  city: string;
  pathway: "olympic" | "paralympic";
  sport: string;
  athlete_anchor: string;
  achievement: string;
  narrative: string;
  ghost_quote: string;
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

// Hand-authored seed history per archetype — Gemini enriches narrative around these anchors.
// Each archetype has 3 Olympic + 3 Paralympic anchors arranged in chronological order.
// The corridor renderer alternates O/P presentation order at runtime for parity.
// ADAPTIVE WARRIOR is Paralympic-only by design (no Olympic primaries).
export const ERA_SEEDS: Record<ArchetypeId, Array<Pick<Era, "year" | "games" | "city" | "pathway" | "sport" | "athlete_anchor" | "achievement">>> = {
  1: [
    { year: 1956, games: "Melbourne 1956", city: "Melbourne", pathway: "olympic", sport: "Shot Put", athlete_anchor: "Parry O'Brien", achievement: "Pioneered the 180° glide, redefined throwing biomechanics" },
    { year: 1968, games: "Mexico City 1968", city: "Mexico City", pathway: "olympic", sport: "Discus Throw", athlete_anchor: "Al Oerter", achievement: "Won 4th consecutive Olympic discus gold" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "Discus F44", athlete_anchor: "Jeremy Campbell", achievement: "Paralympic discus gold + world record" },
    { year: 2016, games: "Rio 2016 Paralympics", city: "Rio de Janeiro", pathway: "paralympic", sport: "Discus F44", athlete_anchor: "Jeremy Campbell", achievement: "Defended Paralympic discus title across two cycles" },
    { year: 2020, games: "Tokyo 2020 Paralympics", city: "Tokyo", pathway: "paralympic", sport: "Shot Put F41", athlete_anchor: "Hagan Landry", achievement: "Paralympic shot put silver and American record" },
    { year: 2024, games: "Paris 2024", city: "Paris", pathway: "olympic", sport: "Shot Put", athlete_anchor: "Ryan Crouser", achievement: "Third consecutive Olympic gold; raised the world record three times" },
  ],
  2: [
    { year: 1972, games: "Munich 1972", city: "Munich", pathway: "olympic", sport: "Marathon", athlete_anchor: "Frank Shorter", achievement: "Olympic marathon gold sparked the American running boom" },
    { year: 1984, games: "Los Angeles 1984", city: "Los Angeles", pathway: "olympic", sport: "Marathon", athlete_anchor: "Joan Benoit", achievement: "Won the first-ever Olympic women's marathon" },
    { year: 1992, games: "Barcelona 1992 Paralympics", city: "Barcelona", pathway: "paralympic", sport: "Wheelchair Marathon", athlete_anchor: "Jean Driscoll", achievement: "Paralympic gold; 8x Boston Marathon wheelchair champion" },
    { year: 2012, games: "London 2012 Paralympics", city: "London", pathway: "paralympic", sport: "Handcycle (H4)", athlete_anchor: "Oz Sanchez", achievement: "Multi-Games handcycle medalist representing Team USA" },
    { year: 2016, games: "Rio 2016", city: "Rio de Janeiro", pathway: "olympic", sport: "Cycling (Time Trial)", athlete_anchor: "Kristin Armstrong", achievement: "Third Olympic time-trial gold at age 42" },
    { year: 2024, games: "Paris 2024 Paralympics", city: "Paris", pathway: "paralympic", sport: "Para-Triathlon (PT4)", athlete_anchor: "Grace Norman", achievement: "Repeat Paralympic gold across two cycles" },
  ],
  3: [
    { year: 1976, games: "Montreal 1976", city: "Montreal", pathway: "olympic", sport: "Shooting (50m Rifle)", athlete_anchor: "Margaret Murdock", achievement: "First American woman to win an Olympic shooting medal" },
    { year: 1984, games: "Los Angeles 1984", city: "Los Angeles", pathway: "olympic", sport: "Archery (Recurve)", athlete_anchor: "Darrell Pace", achievement: "Olympic gold and world record in individual recurve" },
    { year: 2004, games: "Athens 2004 Paralympics", city: "Athens", pathway: "paralympic", sport: "Para-Archery (Compound)", athlete_anchor: "Jeff Fabry", achievement: "Multiple Paralympic medals using mouth-tab technique" },
    { year: 2016, games: "Rio 2016 Paralympics", city: "Rio de Janeiro", pathway: "paralympic", sport: "Para-Shooting (R3)", athlete_anchor: "McKenna Geer", achievement: "Multi-Games Paralympic shooting medalist" },
    { year: 2020, games: "Tokyo 2020 Paralympics", city: "Tokyo", pathway: "paralympic", sport: "Para-Archery (Compound W1)", athlete_anchor: "Matt Stutzman", achievement: "Paralympic medalist shooting with his feet — the Armless Archer" },
    { year: 2024, games: "Paris 2024", city: "Paris", pathway: "olympic", sport: "Artistic Gymnastics", athlete_anchor: "Simone Biles", achievement: "Returned for a fourth Olympics; team and all-around gold" },
  ],
  4: [
    { year: 1948, games: "London 1948", city: "London", pathway: "olympic", sport: "Decathlon", athlete_anchor: "Bob Mathias", achievement: "Won decathlon gold at 17 years old" },
    { year: 1988, games: "Seoul 1988", city: "Seoul", pathway: "olympic", sport: "Heptathlon", athlete_anchor: "Jackie Joyner-Kersee", achievement: "Heptathlon world record + long jump gold in same Games" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "Para-Athletics (T44)", athlete_anchor: "April Holmes", achievement: "Multi-event Paralympic medalist across two Games" },
    { year: 2012, games: "London 2012 Paralympics", city: "London", pathway: "paralympic", sport: "Sitting Volleyball", athlete_anchor: "Kari Miller", achievement: "Captained Team USA to Paralympic silver" },
    { year: 2020, games: "Tokyo 2020", city: "Tokyo", pathway: "olympic", sport: "Decathlon", athlete_anchor: "Garrett Scantling", achievement: "Top-five finish reignited US decathlon depth" },
    { year: 2024, games: "Paris 2024 Paralympics", city: "Paris", pathway: "paralympic", sport: "Sitting Volleyball", athlete_anchor: "Lora Webster", achievement: "Five-time Paralympian; longest-tenured Team USA sitting volleyball anchor" },
  ],
  5: [
    { year: 1952, games: "Helsinki 1952", city: "Helsinki", pathway: "olympic", sport: "Freestyle Wrestling", athlete_anchor: "Bill Smith", achievement: "Olympic freestyle gold at welterweight" },
    { year: 1972, games: "Munich 1972", city: "Munich", pathway: "olympic", sport: "Freestyle Wrestling", athlete_anchor: "Dan Gable", achievement: "Won gold without surrendering a single point" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "Wheelchair Rugby", athlete_anchor: "Will Groulx", achievement: "Captained the US to Paralympic gold" },
    { year: 2016, games: "Rio 2016 Paralympics", city: "Rio de Janeiro", pathway: "paralympic", sport: "Wheelchair Rugby", athlete_anchor: "Chuck Aoki", achievement: "Multi-Games Paralympic medalist + flagbearer" },
    { year: 2020, games: "Tokyo 2020", city: "Tokyo", pathway: "olympic", sport: "Freestyle Wrestling", athlete_anchor: "Tamyra Mensah-Stock", achievement: "First Black American woman to win Olympic wrestling gold" },
    { year: 2024, games: "Paris 2024 Paralympics", city: "Paris", pathway: "paralympic", sport: "Para-Powerlifting", athlete_anchor: "Garrison Redd", achievement: "Multiple American records; flagship Para-powerlifter" },
  ],
  6: [
    { year: 1936, games: "Berlin 1936", city: "Berlin", pathway: "olympic", sport: "100m / 200m / Long Jump", athlete_anchor: "Jesse Owens", achievement: "Four Olympic golds in front of a hostile regime" },
    { year: 1988, games: "Seoul 1988", city: "Seoul", pathway: "olympic", sport: "100m Sprint", athlete_anchor: "Florence Griffith Joyner", achievement: "World records in 100m and 200m still stand today" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "T44 Sprint", athlete_anchor: "Jerome Singleton", achievement: "Paralympic sprint medals on prosthetic blades" },
    { year: 2012, games: "London 2012 Paralympics", city: "London", pathway: "paralympic", sport: "T54 Wheelchair Sprint", athlete_anchor: "Tatyana McFadden", achievement: "Multi-distance Paralympic gold; rewrote wheelchair racing" },
    { year: 2020, games: "Tokyo 2020 Paralympics", city: "Tokyo", pathway: "paralympic", sport: "T64 100m Sprint", athlete_anchor: "Hunter Woodhall", achievement: "Paralympic sprint medals on dual blades" },
    { year: 2024, games: "Paris 2024", city: "Paris", pathway: "olympic", sport: "100m Sprint", athlete_anchor: "Noah Lyles", achievement: "Olympic 100m gold in the closest finish in Olympic history" },
  ],
  7: [
    { year: 1956, games: "Melbourne 1956", city: "Melbourne", pathway: "olympic", sport: "Diving (Platform)", athlete_anchor: "Pat McCormick", achievement: "Repeat double-double: gold in 3m and 10m at consecutive Games" },
    { year: 1984, games: "Los Angeles 1984", city: "Los Angeles", pathway: "olympic", sport: "Diving (10m Platform)", athlete_anchor: "Greg Louganis", achievement: "Double diving gold; perfect-form benchmark" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "Para-Equestrian Dressage", athlete_anchor: "Rebecca Hart", achievement: "Five Paralympic Games appearances; multiple World Championship medals" },
    { year: 2016, games: "Rio 2016 Paralympics", city: "Rio de Janeiro", pathway: "paralympic", sport: "Para-Equestrian Dressage", athlete_anchor: "Roxanne Trunnell", achievement: "Multi-Games Paralympic dressage medalist" },
    { year: 2020, games: "Tokyo 2020 Paralympics", city: "Tokyo", pathway: "paralympic", sport: "Para-Equestrian Dressage Grade I", athlete_anchor: "Roxanne Trunnell", achievement: "Two Paralympic golds and a perfect-score test" },
    { year: 2024, games: "Paris 2024", city: "Paris", pathway: "olympic", sport: "Diving (Synchronized 3m)", athlete_anchor: "Sarah Bacon", achievement: "Team USA's first synchronized springboard medal in 16 years" },
  ],
  8: [
    { year: 1988, games: "Seoul 1988 Paralympics", city: "Seoul", pathway: "paralympic", sport: "Wheelchair Basketball", athlete_anchor: "Sharon Hedrick", achievement: "Multi-Games medalist; shaped the US program" },
    { year: 2000, games: "Sydney 2000 Paralympics", city: "Sydney", pathway: "paralympic", sport: "Wheelchair Tennis", athlete_anchor: "David Wagner", achievement: "Paralympic gold in quad doubles" },
    { year: 2008, games: "Beijing 2008 Paralympics", city: "Beijing", pathway: "paralympic", sport: "Goalball", athlete_anchor: "Asya Miller", achievement: "Multiple Paralympic medals across goalball and athletics" },
    { year: 2012, games: "London 2012 Paralympics", city: "London", pathway: "paralympic", sport: "Wheelchair Rugby", athlete_anchor: "Nick Springer", achievement: "Paralympic gold despite quadruple amputation" },
    { year: 2016, games: "Rio 2016 Paralympics", city: "Rio de Janeiro", pathway: "paralympic", sport: "Wheelchair Basketball", athlete_anchor: "Rebecca Murray", achievement: "Two-time Paralympic gold medalist; flagship US wheelchair scorer" },
    { year: 2024, games: "Paris 2024 Paralympics", city: "Paris", pathway: "paralympic", sport: "Wheelchair Tennis", athlete_anchor: "Dana Mathewson", achievement: "Multiple Paralympic appearances; flagship of US wheelchair tennis" },
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
