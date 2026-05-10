// Licensed under the Apache License, Version 2.0
"use client";

import { useAthleteStore } from "@/store/athleteStore";
import { SliderInput } from "@/components/ui/SliderInput";
import { SilhouettePreview } from "./SilhouettePreview";

export function Step1() {
  const { formData, setFormData } = useAthleteStore();

  const heightFt = Math.floor((formData.height_cm ?? 178) / 30.48);
  const heightIn = Math.round(((formData.height_cm ?? 178) / 2.54) - heightFt * 12);
  const weightLb = Math.round((formData.weight_kg ?? 75) * 2.20462);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <div className="kicker">Section 01</div>
        <h2 className="font-display text-5xl font-semibold leading-none tracking-tight">The Basics</h2>
        <p className="text-sm text-[#52525B] font-light">Foundational profile — body, age, sex, dominant side.</p>
      </header>

      <div className="flex gap-10 items-start">
        <div className="flex-1 space-y-8">
          <SliderInput
            label="Height"
            value={formData.height_cm ?? 178}
            min={140}
            max={220}
            unit={`cm  ·  ${heightFt}'${heightIn}"`}
            onChange={(v) => setFormData({ height_cm: v, arm_span_cm: formData.arm_span_cm ?? v })}
          />
          <SliderInput
            label="Weight"
            value={formData.weight_kg ?? 75}
            min={36}
            max={181}
            unit={`kg  ·  ${weightLb} lb`}
            onChange={(v) => setFormData({ weight_kg: v })}
          />
        </div>
        <div className="shrink-0 pt-4 hidden md:block">
          <SilhouettePreview
            height_cm={formData.height_cm ?? 178}
            weight_kg={formData.weight_kg ?? 75}
          />
        </div>
      </div>

      <SliderInput
        label="Age"
        value={formData.age ?? 25}
        min={14}
        max={80}
        unit="years"
        onChange={(v) => setFormData({ age: v })}
      />

      <div className="space-y-3">
        <div className="kicker">Biological Sex</div>
        <p className="text-xs text-[#52525B] -mt-1 font-light italic">
          Used only for sport archetype matching — not for judgment.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(["male", "female"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFormData({ sex: opt })}
              className={`py-4 font-display text-lg capitalize transition-colors duration-150 border ${
                formData.sex === opt
                  ? "bg-[#0B0B0F] text-[#FDFBF7] border-[#0B0B0F]"
                  : "bg-transparent text-[#0B0B0F] border-[#E4E4E7] hover:border-[#0B0B0F]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="kicker">Dominant Side</div>
        <div className="flex gap-2">
          {(["left", "right", "ambidextrous"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFormData({ dominant_side: opt })}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-150 border ${
                formData.dominant_side === opt
                  ? "bg-[#0A2240] text-[#FDFBF7] border-[#0A2240]"
                  : "bg-transparent text-[#52525B] border-[#E4E4E7] hover:border-[#0B0B0F] hover:text-[#0B0B0F]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
