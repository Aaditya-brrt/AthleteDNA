// Licensed under the Apache License, Version 2.0
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAthleteStore, type TwinAthlete } from "@/store/athleteStore";

interface TwinsTabProps {
  archetypeColor: string;
}

function TwinCard({ twin, archetypeColor, index }: { twin: TwinAthlete; archetypeColor: string; index: number }) {
  const ring = twin.pathway === "olympic" ? "OLY" : "PARA";
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="border border-[#E4E4E7] bg-[#FFFFFF] hover:border-[#0B0B0F] transition-colors p-5 space-y-3"
    >
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="kicker">{ring}  ·  {twin.games.split(" ")[0]}</span>
          {twin.medal && (
            <span
              className="kicker text-[9px] tracking-[0.2em]"
              style={{
                color: twin.medal === "Gold" ? "#A88134" : twin.medal === "Silver" ? "#71717A" : "#92400E",
              }}
            >
              {twin.medal.toUpperCase()}
            </span>
          )}
        </div>
        <h4 className="font-mono font-semibold text-base leading-tight tracking-[0.08em]">{twin.code}</h4>
        <div className="text-xs text-[#52525B] font-light">{twin.event}</div>
      </header>

      <p className="text-xs text-[#52525B] leading-relaxed font-light italic">
        &ldquo;{twin.dna_connection}&rdquo;
      </p>

      <div className="flex items-center gap-3 pt-3 border-t border-[#E4E4E7]">
        <div className="flex-1 h-px bg-[#E4E4E7] relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${twin.similarity_percent}%` }}
            transition={{ duration: 1, delay: index * 0.06 + 0.4 }}
            style={{ background: archetypeColor }}
            className="absolute inset-y-0 left-0 h-px"
          />
        </div>
        <span className="kicker" style={{ color: archetypeColor }}>
          {twin.similarity_percent}%
        </span>
      </div>
    </motion.article>
  );
}

export function TwinsTab({ archetypeColor }: TwinsTabProps) {
  const { formData, classificationResult, twins, setTwins } = useAthleteStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classificationResult || twins) return;
    setLoading(true);
    fetch("/api/twins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        archetypeId: classificationResult.archetype_id,
        height: formData.height_cm ?? 178,
        weight: formData.weight_kg ?? 75,
        sex: formData.sex ?? "male",
        paralympicFirst: Boolean(formData.has_impairment),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setTwins(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [classificationResult, twins, setTwins, formData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#52525B] font-light">
        <div className="w-3 h-3 bg-[#0A2240] mr-3 animate-pulse" />
        Searching the historical record…
      </div>
    );
  }
  if (error) return <div className="text-[#BF0A30]">{error}</div>;
  if (!twins) return null;

  const ordered = formData.has_impairment
    ? [...twins.paralympic, ...twins.olympic]
    : [...twins.olympic, ...twins.paralympic];

  return (
    <div className="space-y-8">
      <header className="space-y-2 max-w-2xl">
        <div className="kicker">Historical Cohorts</div>
        <h3 className="font-display text-3xl font-semibold leading-tight">
          Roster cohorts from 120 years of Team USA that share your biometric cluster.
        </h3>
        <p className="text-sm text-[#52525B] leading-relaxed font-light">
          Equal split: three Olympic, three Paralympic. Cohorts are referenced by discipline-coded handles — never by individual name.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ordered.map((t, i) => (
          <TwinCard key={`${t.code}-${i}`} twin={t} archetypeColor={archetypeColor} index={i} />
        ))}
      </div>
    </div>
  );
}
