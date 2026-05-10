// Licensed under the Apache License, Version 2.0
"use client";

import Link from "next/link";

interface NavbarProps {
  showBackTo?: { href: string; label: string };
  rightSlot?: React.ReactNode;
  variant?: "light" | "dark";
}

export function Navbar({ showBackTo, rightSlot, variant = "light" }: NavbarProps) {
  const isDark = variant === "dark";
  const text = isDark ? "text-[#FDFBF7]" : "text-[#0B0B0F]";
  const muted = isDark ? "text-[#FDFBF7]/60" : "text-[#52525B]";

  return (
    <nav className={`absolute top-0 left-0 right-0 z-30 px-8 py-6 flex items-center justify-between ${text}`}>
      <Link href="/" className="flex items-center gap-3 group">
        <div className={`w-9 h-9 ${isDark ? "bg-[#FDFBF7] text-[#0A2240]" : "bg-[#0A2240] text-[#FDFBF7]"} flex items-center justify-center font-display text-[10px] font-bold tracking-wider`}>
          ADN
        </div>
        <div className="leading-tight">
          <div className="font-display font-bold text-base group-hover:text-[#BF0A30] transition-colors">ATHLETE DNA</div>
          <div className={`kicker text-[9px] ${isDark ? "text-[#FDFBF7]/50" : ""}`}>
            Team USA · 120 Years
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-6">
        {showBackTo && (
          <Link
            href={showBackTo.href}
            className={`kicker text-[10px] hover:text-current transition-colors ${muted}`}
          >
            ← {showBackTo.label}
          </Link>
        )}
        {rightSlot}
      </div>
    </nav>
  );
}
