// Licensed under the Apache License, Version 2.0
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAthleteStore, type ClassificationResult, type FormData } from "@/store/athleteStore";
import { getArchetypeById } from "@/lib/archetypes";
import { buildStages, type Stage } from "@/lib/corridor";
import type { EraWalkData } from "@/lib/eraWalk";

const CorridorScene = dynamic(
  () => import("@/components/three/CorridorScene").then((m) => m.CorridorScene),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#08080b] flex items-center justify-center text-[#FDFBF7]/40 font-mono text-xs uppercase tracking-[0.18em]">
        Building corridor…
      </div>
    ),
  }
);

export default function CorridorPage() {
  const router = useRouter();
  const {
    classificationResult,
    formData,
    paralympicFirst,
    eraWalk,
    setEraWalk,
    twins,
    setTwins,
  } = useAthleteStore();
  const [eraData, setEraData] = useState<EraWalkData | null>(eraWalk);
  const [twinsLoading, setTwinsLoading] = useState(false);
  const [erasLoading, setErasLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait one frame so the persist middleware can rehydrate from sessionStorage
  // before we evaluate classificationResult.
  useEffect(() => {
    const t = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Send back to start if user lands here without an archetype (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (!classificationResult) {
      router.replace("/intake");
    }
  }, [hydrated, classificationResult, router]);

  const archetype = classificationResult ? getArchetypeById(classificationResult.archetype_id) : null;
  const color = archetype?.color ?? "#A88134";
  const isParalympicFirst = paralympicFirst();

  // Fetch eras once
  useEffect(() => {
    if (!classificationResult) return;
    if (eraData && eraData.archetype_id === classificationResult.archetype_id) return;
    setErasLoading(true);
    fetch("/api/era-walk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        archetypeId: classificationResult.archetype_id,
        archetypeName: classificationResult.archetype,
        paralympicFirst: isParalympicFirst,
      }),
    })
      .then((r) => r.json())
      .then((d: EraWalkData) => {
        setEraData(d);
        setEraWalk(d);
      })
      .finally(() => setErasLoading(false));
  }, [classificationResult, eraData, isParalympicFirst, setEraWalk]);

  // Fetch twins once
  useEffect(() => {
    if (!classificationResult) return;
    if (twins) return;
    setTwinsLoading(true);
    fetch("/api/twins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        archetypeId: classificationResult.archetype_id,
        height: formData.height_cm,
        weight: formData.weight_kg,
        sex: formData.sex,
        paralympicFirst: isParalympicFirst,
      }),
    })
      .then((r) => r.json())
      .then((d) => setTwins(d))
      .finally(() => setTwinsLoading(false));
  }, [classificationResult, twins, formData, isParalympicFirst, setTwins]);

  const stages: Stage[] = useMemo(() => {
    if (!classificationResult || !eraData) return [];
    return buildStages({
      classification: classificationResult,
      eras: eraData.eras,
      twins,
      paralympicFirst: isParalympicFirst,
    });
  }, [classificationResult, eraData, twins, isParalympicFirst]);

  const ready = !!classificationResult && !!eraData && stages.length > 0;

  if (!classificationResult) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-[#52525B]">
        Redirecting…
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#08080b] flex flex-col items-center justify-center text-[#FDFBF7] gap-4">
        <div className="kicker text-[#FDFBF7]/60">Building your corridor…</div>
        <div className="font-display text-3xl">{classificationResult.archetype}</div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#FDFBF7]/40 mt-2">
          {erasLoading ? "ERAS · LOADING" : "ERAS · READY"} · {twinsLoading ? "TWINS · LOADING" : twins ? "TWINS · READY" : "TWINS · WARMING"}
        </div>
      </main>
    );
  }

  return (
    <CorridorClient
      stages={stages}
      classification={classificationResult}
      formData={formData}
      paralympicFirst={isParalympicFirst}
      signatureColor={color}
      eraData={eraData}
    />
  );
}

interface CorridorClientProps {
  stages: Stage[];
  classification: ClassificationResult;
  formData: Partial<FormData>;
  paralympicFirst: boolean;
  signatureColor: string;
  eraData: EraWalkData;
}

function CorridorClient({ stages, classification, formData, paralympicFirst, signatureColor, eraData }: CorridorClientProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const [progress, setProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setProgress(Math.max(0, Math.min(1, v)));
  });

  const stageCount = stages.length;
  const activeIndex = useMemo(() => {
    if (stageCount === 0) return 0;
    return Math.min(stageCount - 1, Math.max(0, Math.round(progress * (stageCount - 1))));
  }, [progress, stageCount]);
  const stage = stages[activeIndex];

  const trackHeight = `${stageCount * 110}vh`;

  return (
    <main className="bg-[#08080b] min-h-screen">
      {/* Tall scroll track + sticky canvas */}
      <div ref={trackRef} className="relative" style={{ height: trackHeight }}>
        <div className="sticky top-0 h-screen w-full">
          {/* 3D scene */}
          <div className="absolute inset-0">
            <CorridorScene
              stages={stages}
              classification={classification}
              formData={formData}
              paralympicFirst={paralympicFirst}
              signatureColor={signatureColor}
              scrollProgress={progress}
              activeIndex={activeIndex}
            />
          </div>

          {/* Top meta */}
          <header className="absolute top-6 left-6 right-6 flex items-start justify-between pointer-events-none z-10">
            <div className="space-y-1">
              <div className="kicker text-[#FDFBF7]/70">The Corridor · {classification.archetype}</div>
              <div className="font-mono text-[10px] tracking-[0.18em] text-[#FDFBF7]/40 uppercase">
                Stage {String(activeIndex + 1).padStart(2, "0")} / {String(stageCount).padStart(2, "0")} · {stageHeader(stage)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="kicker text-[#FDFBF7]/40">Powered by Gemini 2.5</div>
              {paralympicFirst && (
                <div className="kicker bg-[#A88134] text-[#FDFBF7] px-2 py-0.5">Paralympic Priority</div>
              )}
            </div>
          </header>

          {/* Stage rail (left) */}
          <div className="absolute top-1/2 left-6 -translate-y-1/2 hidden md:flex flex-col gap-3 pointer-events-none z-10">
            {stages.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="h-[2px] transition-all duration-500"
                  style={{
                    width: i === activeIndex ? 36 : 14,
                    background: i === activeIndex ? signatureColor : "rgba(253,251,247,0.2)",
                  }}
                />
                <span
                  className="font-mono text-[10px] tracking-wider transition-colors"
                  style={{
                    color: i === activeIndex ? signatureColor : "rgba(253,251,247,0.32)",
                  }}
                >
                  {stageRailLabel(s, i)}
                </span>
              </div>
            ))}
          </div>

          {/* Narrative overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`stage-${activeIndex}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
            >
              <div className="bg-gradient-to-t from-[#08080b] via-[#08080b]/85 to-transparent pt-24 pb-10 px-6 md:px-12">
                <div className="max-w-3xl mx-auto">
                  <StageOverlay
                    stage={stage}
                    activeIndex={activeIndex}
                    classification={classification}
                    formData={formData}
                    signatureColor={signatureColor}
                    eraData={eraData}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Scroll hint — first room only */}
          {activeIndex === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 0.8 }}
              className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none z-10"
            >
              <span className="kicker text-[#FDFBF7]/60 rotate-90 origin-center mb-3">Scroll</span>
              <svg width="14" height="44" viewBox="0 0 14 44" fill="none" className="text-[#FDFBF7]/60">
                <path d="M7 0V40M7 40L1 34M7 40L13 34" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </motion.div>
          )}

          {/* Final-stage CTA — interactive button */}
          {stage?.kind === "mirror_exit" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
            >
              <Link
                href="/profile"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#FDFBF7] text-[#08080b] font-semibold uppercase tracking-[0.2em] text-xs hover:bg-[#A88134] hover:text-[#FDFBF7] transition-colors border border-[#FDFBF7]"
              >
                Open Your Dossier
                <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          )}

          {/* Bottom progress rail */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FDFBF7]/8 z-10">
            <motion.div
              className="h-full"
              style={{ background: signatureColor, scaleX: progress, transformOrigin: "0% 50%" }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function stageHeader(stage: Stage | undefined): string {
  if (!stage) return "";
  if (stage.kind === "threshold") return "THRESHOLD";
  if (stage.kind === "era") return stage.era.pathway === "olympic" ? "OLYMPIC ERA" : "PARALYMPIC ERA";
  if (stage.kind === "twins_hall") return "TWINS HALL";
  if (stage.kind === "pathway") return "PATHWAY";
  return "DOSSIER · EXIT";
}

function stageRailLabel(stage: Stage, index: number): string {
  if (stage.kind === "era") return String(stage.era.year);
  if (stage.kind === "threshold") return "INTRO";
  if (stage.kind === "twins_hall") return "TWINS";
  if (stage.kind === "pathway") return "SPORTS";
  if (stage.kind === "mirror_exit") return "EXIT";
  return String(index + 1).padStart(2, "0");
}

// Lightweight typewriter
function Typewriter({ text, delay = 18, startAfter = 0 }: { text: string; delay?: number; startAfter?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let cancelled = false;
    let i = 0;
    const start = setTimeout(() => {
      const tick = () => {
        if (cancelled) return;
        i += 1;
        setShown(text.slice(0, i));
        if (i < text.length) setTimeout(tick, delay);
      };
      tick();
    }, startAfter);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [text, delay, startAfter]);
  return <>{shown}</>;
}

// Per-stage overlay content
function StageOverlay({
  stage,
  activeIndex,
  classification,
  formData,
  signatureColor,
  eraData,
}: {
  stage: Stage | undefined;
  activeIndex: number;
  classification: CorridorClientProps["classification"];
  formData: CorridorClientProps["formData"];
  signatureColor: string;
  eraData: EraWalkData;
}) {
  if (!stage) return null;
  const stageNum = String(activeIndex + 1).padStart(2, "0");

  if (stage.kind === "threshold") {
    return (
      <div className="space-y-4 text-[#FDFBF7]">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: signatureColor }}>
            Stage {stageNum}
          </span>
          <span className="kicker text-[#FDFBF7]/60">Threshold · Curator's Note</span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight" style={{ color: signatureColor }}>
          {classification.archetype}
        </h2>
        <p className="font-display italic text-lg text-[#FDFBF7]/90 leading-snug">
          <Typewriter key={`tag-${activeIndex}`} text={`"${classification.tagline}"`} delay={14} />
        </p>
        <p className="text-sm text-[#FDFBF7]/75 max-w-prose font-light leading-relaxed">
          <Typewriter
            key={`intro-${activeIndex}`}
            text={eraData.intro}
            delay={10}
            startAfter={400}
          />
        </p>
        <div className="text-[10px] font-mono text-[#FDFBF7]/45 tracking-[0.2em] uppercase pt-2 border-t border-[#FDFBF7]/15">
          Six historical anchors · One Twins Hall · One Pathway Room · One Dossier Exit
        </div>
      </div>
    );
  }

  if (stage.kind === "era") {
    const era = stage.era;
    return (
      <div className="space-y-4 text-[#FDFBF7]">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: signatureColor }}>
            Stage {stageNum} · Era {String(stage.eraNumber).padStart(2, "0")}
          </span>
          <span className="kicker text-[#FDFBF7]/65">
            {era.pathway === "olympic" ? "Olympic" : "Paralympic"} · {era.city} · {era.year}
          </span>
        </div>
        <h3 className="font-display text-2xl md:text-3xl font-semibold leading-tight">
          <Typewriter key={`title-${activeIndex}`} text={era.athlete_anchor} delay={20} />
        </h3>
        <p className="text-[15px] leading-relaxed text-[#FDFBF7]/85 max-w-prose font-light">
          <Typewriter key={`narr-${activeIndex}`} text={era.narrative} delay={12} startAfter={300} />
        </p>
        <blockquote
          className="pl-4 border-l-2 italic font-display text-lg text-[#FDFBF7]/90"
          style={{ borderColor: signatureColor }}
        >
          <Typewriter key={`q-${activeIndex}`} text={era.ghost_quote} delay={18} startAfter={1000} />
        </blockquote>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-[12px] text-[#FDFBF7]/70 leading-relaxed">
          <div>
            <div className="kicker text-[#FDFBF7]/50 mb-1">Cultural Context</div>
            {era.cultural_context}
          </div>
          <div>
            <div className="kicker text-[#FDFBF7]/50 mb-1">Archetype Pattern</div>
            {era.takeaway}
          </div>
        </div>
      </div>
    );
  }

  if (stage.kind === "twins_hall") {
    const total = stage.olympic.length + stage.paralympic.length;
    return (
      <div className="space-y-3 text-[#FDFBF7]">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: signatureColor }}>
            Stage {stageNum}
          </span>
          <span className="kicker text-[#FDFBF7]/65">Twins Hall</span>
        </div>
        <h3 className="font-display text-2xl md:text-3xl font-semibold leading-tight">
          {total} historical athletes share your DNA proportions.
        </h3>
        <p className="text-[14px] text-[#FDFBF7]/75 leading-relaxed font-light max-w-prose">
          On the left wall, {stage.olympic.length} Team USA Olympians whose biometric profile sits closest to yours. On the
          right, {stage.paralympic.length} Paralympians the same way. Each plaque shows year · sport · similarity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 pt-3 text-[12px] text-[#FDFBF7]/85">
          <div className="space-y-1">
            <div className="kicker text-[#FDFBF7]/50 mb-1">Olympic Twins</div>
            {stage.olympic.slice(0, 3).map((t) => (
              <div key={`o-${t.name}`} className="flex justify-between gap-3 border-b border-[#FDFBF7]/10 py-1">
                <span>{t.name}</span>
                <span className="font-mono text-[#FDFBF7]/55">{t.similarity_percent}% · {t.year}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="kicker text-[#FDFBF7]/50 mb-1">Paralympic Twins</div>
            {stage.paralympic.slice(0, 3).map((t) => (
              <div key={`p-${t.name}`} className="flex justify-between gap-3 border-b border-[#FDFBF7]/10 py-1">
                <span>{t.name}</span>
                <span className="font-mono text-[#FDFBF7]/55">{t.similarity_percent}% · {t.year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (stage.kind === "pathway") {
    return (
      <div className="space-y-3 text-[#FDFBF7]">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: signatureColor }}>
            Stage {stageNum}
          </span>
          <span className="kicker text-[#FDFBF7]/65">Pathway Room</span>
        </div>
        <h3 className="font-display text-2xl md:text-3xl font-semibold leading-tight">
          Your top three sports — Olympic and Paralympic, equal depth.
        </h3>
        <p className="text-[14px] text-[#FDFBF7]/75 leading-relaxed font-light max-w-prose">
          Match scores reflect how closely your archetype centroid aligns with each sport's historical Team USA roster.
          The two pathways are presented side-by-side; neither is a default.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 pt-3 text-[12px] text-[#FDFBF7]/85">
          <div className="space-y-1">
            <div className="kicker text-[#FDFBF7]/50 mb-1">Olympic</div>
            {stage.olympic.map((s) => (
              <div key={`o-${s.name}`} className="flex justify-between gap-3 border-b border-[#FDFBF7]/10 py-1">
                <span>{s.name}</span>
                <span className="font-mono text-[#FDFBF7]/55">{s.match_percent}%</span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="kicker text-[#FDFBF7]/50 mb-1">Paralympic</div>
            {stage.paralympic.map((s) => (
              <div key={`p-${s.name}`} className="flex justify-between gap-3 border-b border-[#FDFBF7]/10 py-1">
                <span>{s.name}</span>
                <span className="font-mono text-[#FDFBF7]/55">{s.match_percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // mirror_exit
  return (
    <div className="space-y-4 text-[#FDFBF7]">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: signatureColor }}>
          Stage {stageNum}
        </span>
        <span className="kicker text-[#FDFBF7]/65">Mirror · Closing Frame</span>
      </div>
      <h3 className="font-display text-2xl md:text-3xl font-semibold leading-tight">
        The corridor knows you now.
      </h3>
      <p className="text-[14px] text-[#FDFBF7]/85 leading-relaxed font-light max-w-prose">
        <Typewriter key={`mr-${activeIndex}`} text={eraData.outro} delay={12} />
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#FDFBF7]/15 text-[12px]">
        <div>
          <div className="kicker text-[#FDFBF7]/50 mb-1">Height</div>
          <div className="font-display text-base">{formData.height_cm ?? "—"} cm</div>
        </div>
        <div>
          <div className="kicker text-[#FDFBF7]/50 mb-1">Weight</div>
          <div className="font-display text-base">{formData.weight_kg ?? "—"} kg</div>
        </div>
        <div>
          <div className="kicker text-[#FDFBF7]/50 mb-1">Arm Span</div>
          <div className="font-display text-base">{formData.arm_span_cm ?? "—"} cm</div>
        </div>
        <div>
          <div className="kicker text-[#FDFBF7]/50 mb-1">Build</div>
          <div className="font-display text-base capitalize">
            {String(formData.build ?? "—").replace("_", " ")}
          </div>
        </div>
      </div>
      <p className="text-xs text-[#FDFBF7]/55 italic leading-relaxed pt-2">
        The Mirror room is illustrative — these moments are public record. Athletes with this archetype have historically
        aligned with these disciplines; this is not a personal performance prediction.
      </p>
    </div>
  );
}
