// Licensed under the Apache License, Version 2.0
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAthleteStore } from "@/store/athleteStore";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";

const SimulationScene = dynamic(
  () => import("@/components/three/SimulationScene").then((m) => m.SimulationScene),
  { ssr: false, loading: () => <div className="h-[400px] bg-[#0B0B0F] flex items-center justify-center text-[#FDFBF7]/40 font-mono text-xs">Loading simulation…</div> }
);

interface SimulateTabProps {
  archetypeColor: string;
  archetypeId: number;
}

interface SimulateResult {
  range: { min: number; max: number; unit: string; lower_is_better: boolean; median: number };
  historicalContext: string;
  distributionData: { x: number; y: number }[];
  twins?: { name: string; value: number }[];
}

export function SimulateTab({ archetypeColor, archetypeId }: SimulateTabProps) {
  const { formData, classificationResult, selectedSport, setSelectedSport } = useAthleteStore();
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<SimulateResult | null>(null);
  const [loading, setLoading] = useState(false);

  const allSports = useMemo(() => {
    if (!classificationResult) return [];
    return [
      ...classificationResult.olympic_sports.map((s) => ({ name: s.name, pathway: "olympic" as const })),
      ...classificationResult.paralympic_sports.map((s) => ({ name: s.name, pathway: "paralympic" as const })),
    ];
  }, [classificationResult]);

  const activeSport = selectedSport ?? allSports[0]?.name;

  useEffect(() => {
    if (!activeSport) return;
    setLoading(true);
    fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport: activeSport, archetypeId }),
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeSport, archetypeId]);

  function startSim() {
    setRunning(false);
    setTimeout(() => setRunning(true), 50);
    setTimeout(() => setRunning(false), 6500);
  }

  if (!classificationResult) return null;

  const config = {
    height_cm: formData.height_cm,
    weight_kg: formData.weight_kg,
    arm_span_cm: formData.arm_span_cm,
    build: formData.build,
    paralympic: formData.has_impairment
      ? {
          type: (formData.impairment_category?.startsWith("limb_lower")
            ? "limb_lower"
            : formData.impairment_category?.startsWith("vision")
            ? "vision"
            : "wheelchair") as "limb_lower" | "vision" | "wheelchair",
        }
      : undefined,
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="kicker">Sport Simulation</div>
        <h3 className="font-display text-3xl font-semibold leading-tight">
          See your archetype perform.
        </h3>
      </header>

      <div className="space-y-2">
        <div className="kicker">Choose Sport</div>
        <div className="flex flex-wrap gap-1.5">
          {allSports.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setSelectedSport(s.name)}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide transition-colors duration-150 border flex items-center gap-2 ${
                activeSport === s.name
                  ? "bg-[#0B0B0F] text-[#FDFBF7] border-[#0B0B0F]"
                  : "bg-transparent border-[#E4E4E7] text-[#52525B] hover:border-[#0B0B0F] hover:text-[#0B0B0F]"
              }`}
            >
              <span className="kicker text-[9px]">{s.pathway === "olympic" ? "OLY" : "PARA"}</span>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0B0B0F] border border-[#0B0B0F] relative">
        <div className="h-[420px]">
          <SimulationScene
            sport={activeSport ?? ""}
            config={config}
            archetypeColor={archetypeColor}
            running={running}
          />
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="text-xs font-mono text-[#FDFBF7]/80 bg-[#0B0B0F] border border-[#FDFBF7]/20 px-3 py-1.5 uppercase tracking-[0.12em]">
            {activeSport}
          </div>
          <button
            type="button"
            onClick={startSim}
            disabled={running}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] bg-[#FDFBF7] text-[#0B0B0F] hover:bg-[#A88134] hover:text-[#FDFBF7] disabled:opacity-50 transition-colors"
          >
            {running ? "Running…" : "Run Simulation"}
          </button>
        </div>
      </div>

      {loading && <div className="text-[#52525B] text-sm font-light">Loading historical range…</div>}

      {data && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#E4E4E7] p-6 space-y-5 bg-[#FFFFFF]"
        >
          <header>
            <div className="kicker mb-2">Historical Archetype Distribution</div>
            <p className="text-sm text-[#0B0B0F] leading-relaxed">{data.historicalContext}</p>
          </header>
          <div className="h-52 w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
              <AreaChart data={data.distributionData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={archetypeColor} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={archetypeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={["auto", "auto"]}
                  tick={{ fill: "#52525B", fontSize: 11 }}
                  tickLine={{ stroke: "#E4E4E7" }}
                  axisLine={{ stroke: "#0B0B0F" }}
                  label={{ value: data.range.unit, position: "insideBottomRight", offset: -4, fill: "#52525B", fontSize: 10 }}
                />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#FDFBF7", border: "1px solid #0B0B0F", borderRadius: 0, fontSize: 12 }}
                  labelStyle={{ color: "#0B0B0F", fontWeight: 600 }}
                  labelFormatter={(v) => `${v} ${data.range.unit}`}
                  formatter={(v) => [String(v), "Density"]}
                />
                <ReferenceLine
                  x={data.range.median}
                  stroke="#0A2240"
                  strokeDasharray="3 3"
                  label={{ value: "Median", fill: "#0A2240", fontSize: 10, position: "top" }}
                />
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke={archetypeColor}
                  fill="url(#distGrad)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-[#52525B] font-light italic leading-relaxed border-t border-[#E4E4E7] pt-3">
            Athletes with this archetype profile have historically been represented across the shaded range.
            This is not a personal performance prediction.
          </p>
        </motion.section>
      )}
    </div>
  );
}
