// Licensed under the Apache License, Version 2.0
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

interface SimulateReq {
  sport: string;
  archetypeId: number;
}

interface RangeRecord {
  unit: string;
  lower_is_better: boolean;
  ranges_by_archetype: Record<string, { min: number; max: number; median: number }>;
  context: string;
}

let _ranges: Record<string, RangeRecord> | null = null;
function loadRanges(): Record<string, RangeRecord> {
  if (_ranges) return _ranges;
  const path = join(process.cwd(), "data", "sport_ranges.json");
  _ranges = JSON.parse(readFileSync(path, "utf-8"));
  return _ranges!;
}

// Generate a smooth bell-curve distribution
function buildDistribution(min: number, max: number, median: number, points = 30): { x: number; y: number }[] {
  const data: { x: number; y: number }[] = [];
  const sigma = (max - min) / 5;
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const x = min + t * (max - min);
    const y = Math.exp(-Math.pow(x - median, 2) / (2 * sigma * sigma));
    data.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 1000) / 1000 });
  }
  return data;
}

// Heuristic fallback for sports without explicit ranges
function fallbackRange(sport: string): RangeRecord {
  const lower = /sprint|100m|200m|race|wheelchair racing|marathon|t5/i.test(sport);
  return {
    unit: lower ? "seconds" : "score",
    lower_is_better: lower,
    ranges_by_archetype: {
      default: { min: 1, max: 100, median: 50 },
    },
    context: `Athletes with this archetype profile have historically been represented across the typical competitive range of ${sport} for Team USA.`,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SimulateReq;
    const ranges = loadRanges();
    const record = ranges[body.sport] ?? fallbackRange(body.sport);

    const archetypeKey = String(body.archetypeId);
    const range =
      record.ranges_by_archetype[archetypeKey] ??
      record.ranges_by_archetype["default"] ??
      Object.values(record.ranges_by_archetype)[0] ??
      { min: 1, max: 100, median: 50 };

    return NextResponse.json({
      range: {
        min: range.min,
        max: range.max,
        median: range.median,
        unit: record.unit,
        lower_is_better: record.lower_is_better,
      },
      historicalContext: record.context,
      distributionData: buildDistribution(range.min, range.max, range.median),
    });
  } catch (e) {
    console.error("simulate error", e);
    return NextResponse.json({
      range: { min: 0, max: 100, median: 50, unit: "score", lower_is_better: false },
      historicalContext: "Historical range data is currently unavailable.",
      distributionData: buildDistribution(0, 100, 50),
    });
  }
}
