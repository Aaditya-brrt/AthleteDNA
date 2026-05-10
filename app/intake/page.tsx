// Licensed under the Apache License, Version 2.0
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAthleteStore } from "@/store/athleteStore";
import { Step1 } from "@/components/intake/Step1";
import { Step2 } from "@/components/intake/Step2";
import { Step3 } from "@/components/intake/Step3";
import { ProgressBar } from "@/components/intake/ProgressBar";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";

export default function IntakePage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { formData } = useAthleteStore();

  const canProceedStep1 = Boolean(formData.height_cm && formData.weight_kg && formData.age && formData.sex && formData.dominant_side);
  const canProceedStep2 = Boolean(formData.arm_span_cm && formData.flexibility && formData.build);
  const canProceedStep3 = Boolean((formData.sports?.length ?? 0) > 0 && formData.competition_level && formData.active_years !== undefined);

  const canProceed = step === 1 ? canProceedStep1 : step === 2 ? canProceedStep2 : canProceedStep3;

  function next() {
    if (!canProceed) return;
    if (step < 3) setStep(step + 1);
    else router.push("/conversation");
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  return (
    <main className="relative min-h-screen bg-[#FDFBF7] pb-24">
      <Navbar showBackTo={{ href: "/", label: "Home" }} />

      <div className="max-w-2xl mx-auto pt-32 px-6 space-y-12">
        <ProgressBar step={step} total={3} />

        <div className="relative min-h-[520px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {step === 1 && <Step1 />}
              {step === 2 && <Step2 />}
              {step === 3 && <Step3 />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#E4E4E7]">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 1}
            size="md"
          >
            ← Back
          </Button>
          <Button onClick={next} disabled={!canProceed} size="md">
            {step < 3 ? "Continue →" : "Analyze My DNA →"}
          </Button>
        </div>
      </div>
    </main>
  );
}
