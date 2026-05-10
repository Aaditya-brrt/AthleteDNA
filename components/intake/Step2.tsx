// Licensed under the Apache License, Version 2.0
"use client";

import { useAthleteStore, type FormData } from "@/store/athleteStore";
import { SliderInput } from "@/components/ui/SliderInput";
import { ToggleCard } from "@/components/ui/ToggleCard";

const FLEXIBILITY_OPTIONS: Array<{ value: FormData["flexibility"]; label: string; description: string }> = [
  { value: "limited", label: "Limited", description: "Tight, less range of motion" },
  { value: "average", label: "Average", description: "Standard range" },
  { value: "above_average", label: "Above Average", description: "Naturally flexible" },
  { value: "hypermobile", label: "Hypermobile", description: "Double-jointed range" },
];

const BUILD_OPTIONS: Array<{ value: FormData["build"]; label: string }> = [
  { value: "lean", label: "Lean" },
  { value: "athletic", label: "Athletic" },
  { value: "stocky", label: "Stocky" },
  { value: "tall_lean", label: "Tall & Lean" },
  { value: "broad_powerful", label: "Broad & Powerful" },
];

const HR_OPTIONS: Array<{ value: NonNullable<FormData["resting_hr"]>; label: string }> = [
  { value: "low", label: "Low (<60)" },
  { value: "average", label: "Average (60–80)" },
  { value: "athlete", label: "Athlete (<50)" },
];

export function Step2() {
  const { formData, setFormData } = useAthleteStore();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <div className="kicker">Section 02</div>
        <h2 className="font-display text-5xl font-semibold leading-none tracking-tight">Your Body</h2>
        <p className="text-sm text-[#52525B] font-light">Anthropometric details that sharpen archetype matching.</p>
      </header>

      <SliderInput
        label="Arm Span"
        value={formData.arm_span_cm ?? formData.height_cm ?? 178}
        min={140}
        max={230}
        unit="cm"
        helper="Fingertip-to-fingertip in T-pose. Defaults to your height as a starting estimate."
        onChange={(v) => setFormData({ arm_span_cm: v })}
      />

      <div className="space-y-3">
        <div className="kicker">Flexibility</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {FLEXIBILITY_OPTIONS.map((opt) => (
            <ToggleCard
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={formData.flexibility === opt.value}
              onClick={() => setFormData({ flexibility: opt.value })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="kicker">Build</div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {BUILD_OPTIONS.map((opt) => (
            <ToggleCard
              key={opt.value}
              label={opt.label}
              selected={formData.build === opt.value}
              onClick={() => setFormData({ build: opt.value })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="kicker flex items-center gap-2">
          Resting Heart Rate
          <span className="text-[9px] text-[#52525B]/70 border border-[#E4E4E7] px-1.5 py-0.5 normal-case tracking-normal">
            optional
          </span>
        </div>
        <div className="flex gap-2">
          {HR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormData({ resting_hr: opt.value })}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-150 border ${
                formData.resting_hr === opt.value
                  ? "bg-[#0A2240] text-[#FDFBF7] border-[#0A2240]"
                  : "bg-transparent text-[#52525B] border-[#E4E4E7] hover:border-[#0B0B0F] hover:text-[#0B0B0F]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
