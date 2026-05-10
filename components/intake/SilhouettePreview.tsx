// Licensed under the Apache License, Version 2.0
"use client";

interface SilhouettePreviewProps {
  height_cm: number;
  weight_kg: number;
}

export function SilhouettePreview({ height_cm, weight_kg }: SilhouettePreviewProps) {
  const heightScale = height_cm / 178;
  const widthScale = Math.max(0.7, Math.min(1.5, weight_kg / 75));
  const baseWidth = 50;
  const baseHeight = 200 * heightScale;
  const width = baseWidth * widthScale;
  const totalH = baseHeight + 20;
  return (
    <svg viewBox={`0 0 100 220`} className="w-20 h-52">
      {/* Head */}
      <circle cx="50" cy={220 - totalH} r="10" fill="#0A2240" />
      {/* Torso */}
      <rect
        x={50 - width / 2}
        y={220 - totalH + 12}
        width={width}
        height={baseHeight * 0.45}
        rx={width / 2}
        fill="#0A2240"
      />
      {/* Legs */}
      <rect
        x={50 - width / 4 - 3}
        y={220 - totalH + 12 + baseHeight * 0.45}
        width={5}
        height={baseHeight * 0.5}
        fill="#0A2240"
      />
      <rect
        x={50 + width / 4 - 2}
        y={220 - totalH + 12 + baseHeight * 0.45}
        width={5}
        height={baseHeight * 0.5}
        fill="#0A2240"
      />
    </svg>
  );
}
