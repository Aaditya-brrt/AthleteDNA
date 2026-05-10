// Licensed under the Apache License, Version 2.0
"use client";

import { type ReactNode } from "react";

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  helper?: ReactNode;
  optional?: boolean;
  formatValue?: (v: number) => string;
}

export function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  helper,
  optional,
  formatValue,
}: SliderInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label className="kicker flex items-center gap-2">
          {label}
          {optional && (
            <span className="text-[9px] text-[#52525B]/70 border border-[#E4E4E7] px-1.5 py-0.5">
              optional
            </span>
          )}
        </label>
        <span className="font-display text-3xl font-semibold text-[#0B0B0F] leading-none">
          {formatValue ? formatValue(value) : value}
          <span className="font-sans text-xs font-medium text-[#52525B] ml-1.5 tracking-normal normal-case">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ ["--val" as string]: `${((value - min) / (max - min)) * 100}%` }}
      />
      {helper && <div className="text-xs text-[#52525B]">{helper}</div>}
    </div>
  );
}
