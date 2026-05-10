// Licensed under the Apache License, Version 2.0
"use client";

import { motion } from "framer-motion";

interface TagCloudProps {
  options: readonly string[];
  selected: string[];
  onToggle: (tag: string) => void;
}

export function TagCloud({ options, selected, onToggle }: TagCloudProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((tag) => {
        const isSelected = selected.includes(tag);
        return (
          <motion.button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            whileTap={{ scale: 0.97 }}
            className={`px-3 py-1.5 text-xs font-medium tracking-wide transition-colors duration-150 border ${
              isSelected
                ? "bg-[#0A2240] text-[#FDFBF7] border-[#0A2240]"
                : "bg-transparent border-[#E4E4E7] text-[#52525B] hover:border-[#0B0B0F] hover:text-[#0B0B0F]"
            }`}
          >
            {tag}
          </motion.button>
        );
      })}
    </div>
  );
}
