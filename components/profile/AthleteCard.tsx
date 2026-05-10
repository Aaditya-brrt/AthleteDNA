// Licensed under the Apache License, Version 2.0
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAthleteStore } from "@/store/athleteStore";
import { getArchetypeById } from "@/lib/archetypes";

export function AthleteCard() {
  const { classificationResult } = useAthleteStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!classificationResult) return null;
  const archetype = getArchetypeById(classificationResult.archetype_id);
  const color = archetype?.color ?? "#0A2240";

  async function downloadCard() {
    if (!cardRef.current || !classificationResult) return;
    const archetypeName = classificationResult.archetype;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#FDFBF7",
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `athlete-dna-${archetypeName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  function shareOnX() {
    if (!classificationResult) return;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = `I discovered my Athlete DNA — I'm a ${classificationResult.archetype} aligned with Team USA's elite athletes. Discover yours →`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=TeamUSA,AthleteDNA,LA28`;
    window.open(xUrl, "_blank");
  }

  const olympicSports = classificationResult.olympic_sports.slice(0, 3);
  const paralympicSports = classificationResult.paralympic_sports.slice(0, 3);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="kicker">Shareable Card</div>
        <h3 className="font-display text-3xl font-semibold leading-tight">
          Your Athlete DNA, in print.
        </h3>
      </header>

      <div className="flex justify-center">
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-[820px] max-w-full bg-[#FDFBF7] border border-[#0B0B0F] min-h-[520px]"
        >
          {/* Top hairline rule with Team USA colors */}
          <div className="absolute top-0 left-0 right-0 flex h-1">
            <div className="flex-1 bg-[#0A2240]" />
            <div className="flex-1 bg-[#FDFBF7]" />
            <div className="flex-1 bg-[#BF0A30]" />
          </div>

          <div className="p-8 grid grid-cols-[1fr_auto] gap-8 h-full">
            <div className="flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="kicker">Athlete DNA · Issue 01</span>
                  <span className="kicker">Team USA · 120 Years</span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="kicker text-[#52525B]">The Archetype</div>
                  <h2
                    className="font-display font-semibold leading-[0.95] tracking-tight"
                    style={{
                      fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)",
                      color: color,
                    }}
                  >
                    {classificationResult.archetype}
                  </h2>
                  <hr className="rule-bold w-12" />
                </div>

                <p className="text-sm text-[#0B0B0F] leading-relaxed font-light italic max-w-[440px]">
                  &ldquo;{classificationResult.athlete_story ?? classificationResult.tagline}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-4 border-t border-[#E4E4E7]">
                <div className="space-y-1">
                  <div className="kicker">Olympic</div>
                  {olympicSports.map((s) => (
                    <div key={s.name} className="text-xs font-light leading-tight">
                      {s.name}
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="kicker">Paralympic</div>
                  {paralympicSports.map((s) => (
                    <div key={s.name} className="text-xs font-light leading-tight">
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5 min-w-[200px] flex flex-col justify-between">
              <div className="space-y-4">
                {(["power", "endurance", "precision"] as const).map((stat) => (
                  <div key={stat}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="kicker">{stat}</span>
                      <span className="font-display font-semibold text-base">
                        {classificationResult.stats[stat]}<span className="text-[#52525B] font-light text-xs">/10</span>
                      </span>
                    </div>
                    <div className="h-px bg-[#E4E4E7] relative">
                      <div
                        className="absolute inset-y-0 left-0 h-[3px] -mt-px"
                        style={{
                          width: `${(classificationResult.stats[stat] / 10) * 100}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-[#E4E4E7] space-y-1">
                <div className="kicker text-[9px]">Powered by</div>
                <div className="font-display text-base">Gemini 2.5</div>
              </div>
            </div>
          </div>

          {/* Bottom rule */}
          <div className="absolute bottom-0 left-0 right-0 flex h-1">
            <div className="flex-1 bg-[#BF0A30]" />
            <div className="flex-1 bg-[#FDFBF7]" />
            <div className="flex-1 bg-[#0A2240]" />
          </div>
        </motion.div>
      </div>

      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={downloadCard}
          disabled={downloading}
          className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] bg-[#0A2240] text-[#FDFBF7] hover:bg-[#BF0A30] disabled:opacity-50 transition-colors"
        >
          {downloading ? "Generating…" : "Download Card"}
        </button>
        <button
          type="button"
          onClick={shareOnX}
          className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] border border-[#0B0B0F] text-[#0B0B0F] hover:bg-[#0B0B0F] hover:text-[#FDFBF7] transition-colors"
        >
          Share on X
        </button>
      </div>
    </div>
  );
}
