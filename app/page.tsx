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
      {/* Top masthead bar */}
      <header className="relative z-30 border-b border-[#0B0B0F]">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#BF0A30] rounded-full" />
            <span className="kicker">Google Cloud × Team USA Hackathon</span>
          </div>
          <div className="kicker text-[#52525B]">Vol. 01 · Issue 01</div>
        </div>
      </header>

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] min-h-[calc(100vh-50px)]">
        {/* Editorial left side */}
        <div className="relative z-20 px-8 lg:px-16 py-16 flex flex-col justify-between">
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="w-10 h-10 bg-[#0A2240] text-[#FDFBF7] flex items-center justify-center font-display text-[10px] font-bold tracking-wider">
                ADN
              </div>
              <div className="leading-tight">
                <div className="font-display font-bold text-base">ATHLETE DNA</div>
                <div className="kicker text-[9px]">Team USA · 120 Years</div>
              </div>
            </Link>
          </div>

          <div className="space-y-8 max-w-[600px]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <div className="kicker">A Sports Science Editorial</div>
              <h1 className="font-display font-semibold leading-[0.92] tracking-tight"
                  style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}>
                120 years of <span className="italic">Team USA.</span>
                <br />
                Where do <span className="text-[#BF0A30]">you</span> fit?
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="border-l-2 border-[#0A2240] pl-5 max-w-md"
            >
              <p className="text-base text-[#0B0B0F] font-light leading-relaxed">
                Discover your <em className="font-display not-italic font-semibold">Athlete Archetype</em> across Olympic and Paralympic pathways. Eight types. 120 years of athletes. One DNA match.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center gap-4 flex-wrap"
            >
              <Link href="/intake">
                <Button size="lg">
                  Begin →
                </Button>
              </Link>
              <div className="flex items-center gap-3 kicker text-[#52525B]">
                <span>Olympic</span>
                <span className="w-1 h-1 bg-[#0B0B0F] rounded-full" />
                <span>Paralympic</span>
                <span className="w-1 h-1 bg-[#0B0B0F] rounded-full" />
                <span>Equal Depth</span>
              </div>
            </motion.div>
          </div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-2 pt-8 border-t border-[#E4E4E7]"
          >
            <div className="flex items-center justify-between kicker">
              <span>Powered by Gemini 2.5</span>
              <span>Deployed on Google Cloud Run</span>
            </div>
          </motion.footer>
        </div>

        {/* Three.js canvas right side — framed */}
        <div className="relative bg-[#0B0B0F] overflow-hidden border-l border-[#0B0B0F] hidden lg:block">
          <DNAHelix />
          <div className="absolute top-6 left-6 z-10 space-y-1">
            <div className="kicker text-[#FDFBF7]/60">Figure 01</div>
            <div className="font-display text-[#FDFBF7] text-sm">The Double Helix</div>
          </div>
          <div className="absolute bottom-6 right-6 z-10 text-right space-y-1">
            <div className="kicker text-[#FDFBF7]/40">Olympic Blue</div>
            <div className="kicker text-[#FDFBF7]/40">Paralympic Gold</div>
          </div>
        </div>
      </div>

      {/* Mobile-only Three.js band */}
      <div className="lg:hidden h-[300px] bg-[#0B0B0F] relative">
        <DNAHelix />
      </div>
    </main>
  );
}
