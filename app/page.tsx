// Licensed under the Apache License, Version 2.0
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const DNAHelix = dynamic(() => import("@/components/three/DNAHelix").then((m) => m.DNAHelix), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#FDFBF7]" />,
});

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FDFBF7] text-[#0B0B0F]">
      {/* Background DNA helix — full-bleed, behind all content */}
      <div className="absolute inset-0 z-0">
        <DNAHelix />
        {/* Soft wash so hero text stays legible over the helix */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(253,251,247,0.55) 0%, rgba(253,251,247,0.7) 40%, rgba(253,251,247,0.9) 100%)",
          }}
        />
      </div>

      {/* Top nav */}
      <header className="relative z-30">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-[#0A2240] text-[#FDFBF7] flex items-center justify-center font-display text-[10px] font-bold tracking-wider">
              ADN
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-base">ATHLETE DNA</div>
              <div className="kicker text-[9px]">Team USA · 120 Years</div>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <span className="kicker text-[#52525B] hidden sm:inline">Powered by Gemini 2.5</span>
            <Link href="/intake">
              <Button size="sm">Begin</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-20 flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 min-h-[calc(100vh-90px)]">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display font-semibold leading-[1.34] md:leading-[1.26] tracking-[0.015em] max-w-5xl"
          style={{ fontSize: "clamp(2.75rem, 7vw, 6.25rem)" }}
        >
          Find your athlete archetype in{" "}
          <span className="italic px-[0.05em]">120 years</span> of Team USA.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 max-w-xl text-base md:text-lg text-[#52525B] font-light leading-relaxed"
        >
          Eight archetypes. Olympic and Paralympic pathways. One match for your build, history, and biomechanics — derived from the entire Team USA record.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/intake">
            <Button size="lg">
              Find your archetype →
            </Button>
          </Link>
          <span className="kicker text-[#52525B]">Takes about 2 minutes</span>
        </motion.div>

        {/* Quick proof points */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 max-w-3xl w-full"
        >
          <div className="space-y-1.5">
            <div className="font-display text-4xl font-semibold">8</div>
            <div className="kicker">Archetypes</div>
            <p className="text-xs text-[#52525B] font-light">
              Distinct biometric profiles across Olympic and Paralympic disciplines.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="font-display text-4xl font-semibold">120</div>
            <div className="kicker">Years of Record</div>
            <p className="text-xs text-[#52525B] font-light">
              Every Team USA roster cohort from Athens 1896 to Paris 2024.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="font-display text-4xl font-semibold">∞</div>
            <div className="kicker">Paths Forward</div>
            <p className="text-xs text-[#52525B] font-light">
              Olympic and Paralympic pathways treated with equal depth — always.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-[#E4E4E7] bg-[#FDFBF7]/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between kicker text-[#52525B]">
          <span>Apache 2.0 · Open Source</span>
          <span>Deployed on Google Cloud Run</span>
        </div>
      </footer>
    </main>
  );
}
