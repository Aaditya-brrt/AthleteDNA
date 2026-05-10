// Licensed under the Apache License, Version 2.0
"use client";

import { motion } from "framer-motion";
import { useAthleteStore, type SportMatch } from "@/store/athleteStore";

interface SportsTabProps {
  archetypeColor: string;
}

function SportCard({
  sport,
  archetypeColor,
  pathway,
  index,
}: {
  sport: SportMatch;
  archetypeColor: string;
  pathway: "olympic" | "paralympic";
  index: number;
}) {
  const ringText = pathway === "olympic" ? "OLY" : "PARA";
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="border border-[#E4E4E7] bg-[#FFFFFF] hover:border-[#0B0B0F] transition-colors p-6 space-y-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="kicker text-[#52525B]">{ringText} · Match Sport</div>
          <h4 className="font-display font-semibold text-2xl leading-tight">{sport.name}</h4>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-3xl leading-none" style={{ color: archetypeColor }}>{sport.match_percent}</div>
          <div className="kicker text-[9px]">% Match</div>
        </div>
      </div>

      <div className="h-px bg-[#E4E4E7]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${sport.match_percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-px"
          style={{ background: archetypeColor }}
        />
      </div>

      <p className="text-sm text-[#52525B] leading-relaxed font-light">
        {sport.blurb}
      </p>
    </motion.article>
  );
}

export function SportsTab({ archetypeColor }: SportsTabProps) {
  const { classificationResult, paralympicFirst } = useAthleteStore();

  if (!classificationResult) return null;

  const olympicCol = (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between border-b border-[#0B0B0F] pb-3">
        <h3 className="font-display text-3xl font-semibold">Olympic</h3>
        <div className="kicker">Pathway</div>
      </header>
      <div className="grid grid-cols-1 gap-3">
        {classificationResult.olympic_sports.slice(0, 3).map((s, i) => (
          <SportCard
            key={s.name}
            sport={s}
            archetypeColor={archetypeColor}
            pathway="olympic"
            index={i}
          />
        ))}
      </div>
    </div>
  );

  const paralympicCol = (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between border-b border-[#0B0B0F] pb-3">
        <h3 className="font-display text-3xl font-semibold flex items-center gap-3">
          Paralympic
          {paralympicFirst() && (
            <span className="kicker bg-[#A88134] text-[#FDFBF7] px-2 py-0.5 normal-case tracking-wider">
              Priority
            </span>
          )}
        </h3>
        <div className="kicker">Pathway</div>
      </header>
      <div className="grid grid-cols-1 gap-3">
        {classificationResult.paralympic_sports.slice(0, 3).map((s, i) => (
          <SportCard
            key={s.name}
            sport={s}
            archetypeColor={archetypeColor}
            pathway="paralympic"
            index={i}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {paralympicFirst() ? (
        <>
          {paralympicCol}
          {olympicCol}
        </>
      ) : (
        <>
          {olympicCol}
          {paralympicCol}
        </>
      )}
    </div>
  );
}
