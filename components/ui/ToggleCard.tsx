// Licensed under the Apache License, Version 2.0
"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface ToggleCardProps {
  label: string;
  icon?: ReactNode;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

export function ToggleCard({ label, icon, description, selected, onClick }: ToggleCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      className={`text-left p-4 transition-colors duration-150 border ${
        selected
          ? "bg-[#0B0B0F] text-[#FDFBF7] border-[#0B0B0F]"
          : "bg-[#FDFBF7] text-[#0B0B0F] border-[#E4E4E7] hover:border-[#0B0B0F]"
      }`}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="text-xl shrink-0 leading-none">{icon}</div>}
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold leading-tight">{label}</div>
          {description && (
            <div className={`text-xs mt-1 ${selected ? "text-[#FDFBF7]/70" : "text-[#52525B]"}`}>
              {description}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
