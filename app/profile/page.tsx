// Licensed under the Apache License, Version 2.0
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAthleteStore } from "@/store/athleteStore";
import { getArchetypeById } from "@/lib/archetypes";
import { Navbar } from "@/components/layout/Navbar";
import { StatBars } from "@/components/profile/StatBars";
import { SportsTab } from "@/components/profile/SportsTab";
import { TwinsTab } from "@/components/profile/TwinsTab";
import { AthleteCard } from "@/components/profile/AthleteCard";
import { Button } from "@/components/ui/Button";

const SidebarAvatar = dynamic(() => import("./SidebarAvatar").then((m) => m.SidebarAvatar), {
  ssr: false,
  loading: () => <div className="aspect-[4/5] bg-[#0B0B0F]" />,
});

type Tab = "sports" | "twins" | "card";

const TABS: { id: Tab; label: string; num: string }[] = [
  { id: "sports", label: "Your Sports", num: "01" },
  { id: "twins", label: "Historical Twins", num: "02" },
  { id: "card", label: "Athlete Card", num: "03" },
];

export default function ProfilePage() {
  const { classificationResult, formData, paralympicFirst } = useAthleteStore();
  const [tab, setTab] = useState<Tab>("sports");

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
    <main className="relative min-h-screen bg-[#FDFBF7] pb-24">
      <Navbar
        showBackTo={{ href: "/corridor", label: "Corridor" }}
        rightSlot={
          <span className="kicker text-[#52525B]">Powered by Gemini 2.5</span>
        }
      />

      {/* Editorial hero band */}
      <section className="border-b border-[#0B0B0F] pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-end">
          <div className="space-y-5">
            <div className="flex items-baseline gap-3">
              <hr className="rule-bold w-12" />
              <span className="kicker">The Archetype Profile</span>
            </div>
            <h1
              className="font-display font-semibold leading-[0.92] tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color }}
            >
              {classificationResult.archetype}
            </h1>
            <p className="font-display italic text-xl text-[#0B0B0F] max-w-2xl leading-snug">
              {classificationResult.tagline}
            </p>
            {isParalympic && (
              <div className="inline-flex items-center gap-2 kicker bg-[#A88134] text-[#FDFBF7] px-3 py-1.5">
                Paralympic Priority
              </div>
            )}
          </div>

          <aside className="space-y-4 border-l border-[#0B0B0F] pl-6">
            <StatBars stats={classificationResult.stats} color={color} />
            <hr className="rule" />
            <dl className="grid grid-cols-2 gap-y-2 text-xs">
              <dt className="kicker">Height</dt>
              <dd className="text-right font-display">{formData.height_cm} cm</dd>
              <dt className="kicker">Weight</dt>
              <dd className="text-right font-display">{formData.weight_kg} kg</dd>
              <dt className="kicker">Arm Span</dt>
              <dd className="text-right font-display">{formData.arm_span_cm} cm</dd>
              <dt className="kicker">Build</dt>
              <dd className="text-right font-display capitalize text-[11px]">
                {formData.build?.replace("_", " ")}
              </dd>
            </dl>
          </aside>
        </div>
      </section>

      {/* Tab nav */}
      <nav className="border-b border-[#E4E4E7] sticky top-0 bg-[#FDFBF7]/95 backdrop-blur-sm z-20">
        <div className="max-w-7xl mx-auto px-8 flex items-stretch overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative py-5 pr-8 flex items-baseline gap-3 transition-colors duration-150 group whitespace-nowrap ${
                tab === t.id ? "text-[#0B0B0F]" : "text-[#52525B] hover:text-[#0B0B0F]"
              }`}
            >
              <span className="font-mono text-[10px] tracking-wider">{t.num}</span>
              <span className="font-display text-base">{t.label}</span>
              {tab === t.id && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute bottom-0 left-0 right-8 h-[2px]"
                  style={{ background: color }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Two-column dashboard */}
      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
          {/* Sidebar — avatar */}
          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <div className="aspect-[4/5] bg-[#0B0B0F] border border-[#0B0B0F] overflow-hidden">
              <SidebarAvatar
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
                color={color}
              />
            </div>
            <div className="space-y-2 border-t border-[#E4E4E7] pt-4">
              <div className="kicker">Reasoning</div>
              <p className="text-xs text-[#52525B] leading-relaxed font-light italic">
                {classificationResult.reasoning}
              </p>
            </div>
          </aside>

          {/* Main */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="min-h-[400px]"
              >
                {tab === "sports" && <SportsTab archetypeColor={color} />}
                {tab === "twins" && <TwinsTab archetypeColor={color} />}
                {tab === "card" && <AthleteCard />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  );
}
