// Licensed under the Apache License, Version 2.0
"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  step: number;
  total: number;
}

export function ProgressBar({ step, total }: ProgressBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between kicker">
        <span>Step {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        <span className="text-[#0A2240]">{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-px bg-[#E4E4E7] relative">
        <motion.div
          className="absolute inset-y-0 left-0 bg-[#0A2240]"
          initial={{ width: 0 }}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
