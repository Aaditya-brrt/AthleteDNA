// Licensed under the Apache License, Version 2.0
"use client";

import { motion } from "framer-motion";

interface StatBarsProps {
  stats: { power: number; endurance: number; precision: number };
  color: string;
  delay?: number;
}

export function StatBars({ stats, color, delay = 0 }: StatBarsProps) {
  const items: Array<{ label: string; value: number }> = [
    { label: "POWER", value: stats.power },
    { label: "ENDURANCE", value: stats.endurance },
    { label: "PRECISION", value: stats.precision },
  ];
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="kicker">{item.label}</span>
            <span className="font-display font-semibold text-[#0B0B0F] text-sm">
              {item.value}<span className="text-[#52525B] font-light">/10</span>
            </span>
          </div>
          <div className="h-px bg-[#E4E4E7] relative">
            <motion.div
              className="absolute inset-y-0 left-0 h-[3px] -mt-px"
              style={{ background: color, top: 0 }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / 10) * 100}%` }}
              transition={{ duration: 1, delay: delay + i * 0.12, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
