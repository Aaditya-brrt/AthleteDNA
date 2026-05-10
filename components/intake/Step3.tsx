// Licensed under the Apache License, Version 2.0
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAthleteStore, type FormData } from "@/store/athleteStore";
import { SliderInput } from "@/components/ui/SliderInput";
import { TagCloud } from "@/components/ui/TagCloud";
import { ToggleCard } from "@/components/ui/ToggleCard";
import { SPORT_LIST, IMPAIRMENT_OPTIONS } from "@/lib/constants";

const COMPETITION_OPTIONS: Array<{ value: FormData["competition_level"]; label: string; description: string }> = [
  { value: "recreational", label: "Just for Fun", description: "Casual, hobby" },
  { value: "school", label: "School / Club", description: "Organized but non-competitive" },
  { value: "varsity", label: "Varsity", description: "Regular competition" },
  { value: "elite", label: "Elite / Pro", description: "Top-tier competitive" },
];

export function Step3() {
  const { formData, setFormData } = useAthleteStore();
  const sports = formData.sports ?? [];

  function toggleSport(s: string) {
    if (sports.includes(s)) {
      setFormData({ sports: sports.filter((x) => x !== s) });
    } else {
      setFormData({ sports: [...sports, s] });
    }
  }

  const grouped = IMPAIRMENT_OPTIONS.reduce<Record<string, typeof IMPAIRMENT_OPTIONS[number][]>>((acc, opt) => {
    if (!acc[opt.group]) acc[opt.group] = [];
    acc[opt.group].push(opt);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <div className="kicker">Section 03</div>
        <h2 className="font-display text-5xl font-semibold leading-none tracking-tight">Activity Profile</h2>
        <p className="text-sm text-[#52525B] font-light">Your sport history sharpens archetype alignment.</p>
      </header>

      <div className="space-y-3">
        <div className="kicker flex items-baseline gap-3">
          Sports & Activities
          <span className="text-[10px] text-[#52525B]/80 normal-case tracking-normal">Select all that apply</span>
        </div>
        <TagCloud options={SPORT_LIST} selected={sports} onToggle={toggleSport} />
      </div>

      <SliderInput
        label="Active Years"
        value={formData.active_years ?? 5}
        min={0}
        max={30}
        unit="years"
        onChange={(v) => setFormData({ active_years: v })}
      />

      <div className="space-y-3">
        <div className="kicker">Competition Level</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {COMPETITION_OPTIONS.map((opt) => (
            <ToggleCard
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={formData.competition_level === opt.value}
              onClick={() => setFormData({ competition_level: opt.value })}
            />
          ))}
        </div>
      </div>

      {/* Paralympic Section */}
      <div className="border-t border-[#E4E4E7] pt-8 space-y-4">
        <div className="space-y-2">
          <div className="kicker text-[#0A2240]">Paralympic Pathway</div>
          <h3 className="font-display text-2xl font-semibold leading-tight">Equal depth. Equal rigor.</h3>
        </div>
        <p className="text-sm text-[#52525B] leading-relaxed font-light max-w-xl">
          Athlete DNA analyzes Olympic and Paralympic pathways with equal analytical rigor.
          If you have a physical impairment, we&apos;ll prioritize your Paralympic profile.
        </p>

        <label className="flex items-center justify-between cursor-pointer p-4 border border-[#E4E4E7] hover:border-[#0B0B0F] transition-colors">
          <span className="font-display font-semibold">I have a physical impairment</span>
          <button
            type="button"
            onClick={() =>
              setFormData({
                has_impairment: !formData.has_impairment,
                impairment_category: !formData.has_impairment ? formData.impairment_category : undefined,
              })
            }
            className={`relative w-11 h-6 transition-colors ${
              formData.has_impairment ? "bg-[#0A2240]" : "bg-[#E4E4E7]"
            }`}
            aria-pressed={formData.has_impairment ?? false}
          >
            <motion.span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-[#FDFBF7]"
              animate={{ x: formData.has_impairment ? 20 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </label>

        <AnimatePresence>
          {formData.has_impairment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                <div className="kicker">Impairment Category (IPC)</div>
                <select
                  value={formData.impairment_category ?? ""}
                  onChange={(e) => setFormData({ impairment_category: e.target.value })}
                  className="w-full p-3 bg-[#FDFBF7] border border-[#E4E4E7] text-[#0B0B0F] focus:border-[#0A2240] focus:outline-none font-sans text-sm"
                >
                  <option value="">Select…</option>
                  {Object.entries(grouped).map(([group, opts]) => (
                    <optgroup key={group} label={group}>
                      {opts.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
