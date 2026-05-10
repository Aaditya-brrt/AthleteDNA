// Licensed under the Apache License, Version 2.0
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAthleteStore } from "@/store/athleteStore";
import { getArchetypeById } from "@/lib/archetypes";
import { Button } from "@/components/ui/Button";

const RevealCanvas = dynamic(() => import("./RevealCanvas").then((m) => m.RevealCanvas), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0B0B0F]" />,
});

export default function RevealPage() {
  const { classificationResult, formData, paralympicFirst } = useAthleteStore();
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 50);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 4000);
    const t4 = setTimeout(() => setPhase(4), 6000);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  if (!classificationResult) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center space-y-4">
          <div className="text-[#52525B]">No archetype data found.</div>
          <Link href="/intake">
            <Button>Start Over</Button>
          </Link>
        </div>
      </main>
    );
  }

  const archetype = getArchetypeById(classificationResult.archetype_id);
  const color = archetype?.color ?? "#0A2240";
  const isParalympic = paralympicFirst();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0F] text-[#FDFBF7]">
      {/* Three.js canvas occupies the full background */}
      <div className="fixed inset-0 z-0">
        <RevealCanvas
          phase={phase}
          archetypeColor={color}
          archetypeName={classificationResult.archetype}
          config={{
            height_cm: formData.height_cm,
            weight_kg: formData.weight_kg,
            arm_span_cm: formData.arm_span_cm,
            build: formData.build,
            paralympic: formData.has_impairment
              ? {
                  type: formData.impairment_category?.startsWith("limb_lower")
                    ? "limb_lower"
                    : formData.impairment_category?.startsWith("vision")
                    ? "vision"
                    : "wheelchair",
                }
              : undefined,
          }}
        />
      </div>

      {/* Editorial overlay frame */}
      <div className="absolute top-0 left-0 right-0 z-30 border-b border-[#FDFBF7]/15">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FDFBF7] text-[#0A2240] flex items-center justify-center font-display text-[9px] font-bold tracking-wider">
              ADN
            </div>
            <span className="kicker text-[#FDFBF7]/70">Reveal · Stage 04</span>
          </div>
          <div className="kicker text-[#FDFBF7]/40">Athlete DNA</div>
        </div>
      </div>

      <AnimatePresence>
        {phase === 4 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none"
            >
              <div className="kicker text-[#FDFBF7]/60">Your Archetype</div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute right-8 top-1/2 -translate-y-1/2 z-30 w-72 space-y-5 border border-[#FDFBF7]/15 p-6 bg-[#0B0B0F]/40 backdrop-blur-md"
            >
              <div className="kicker text-[#FDFBF7]/60">Profile Stats</div>
              {(["power", "endurance", "precision"] as const).map((stat, i) => (
                <div key={stat}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="kicker text-[#FDFBF7]/70">{stat}</span>
                    <span className="font-display text-base">{classificationResult.stats[stat]}<span className="text-[#FDFBF7]/40 font-light text-xs">/10</span></span>
                  </div>
                  <div className="h-px bg-[#FDFBF7]/15 relative">
                    <motion.div
                      className="absolute inset-y-0 left-0 h-[2px]"
                      style={{ background: color, top: 0 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(classificationResult.stats[stat] / 10) * 100}%` }}
                      transition={{ duration: 1, delay: 0.6 + i * 0.15 }}
                    />
                  </div>
                </div>
              ))}
            </motion.aside>

            <motion.footer
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute bottom-10 left-0 right-0 z-30 flex flex-col items-center gap-6 px-6"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: isParalympic ? 1.05 : 1 }}
                  className={`px-4 py-1.5 kicker border flex items-center gap-2 ${
                    isParalympic
                      ? "bg-[#A88134] text-[#FDFBF7] border-[#A88134]"
                      : "bg-transparent text-[#FDFBF7]/70 border-[#FDFBF7]/30"
                  }`}
                >
                  Paralympic Pathway
                </motion.div>
                <div className="text-[#FDFBF7]/30">+</div>
                <div className="px-4 py-1.5 kicker border border-[#FDFBF7]/30 text-[#FDFBF7]/70">
                  Olympic Pathway
                </div>
              </div>
              <Link href="/corridor">
                <button className="px-9 py-4 text-xs font-semibold uppercase tracking-[0.14em] bg-[#FDFBF7] text-[#0B0B0F] hover:bg-[#A88134] hover:text-[#FDFBF7] transition-colors">
                  Enter the Corridor →
                </button>
              </Link>
            </motion.footer>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
