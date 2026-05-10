// Licensed under the Apache License, Version 2.0
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#0A2240] text-[#FDFBF7] hover:bg-[#BF0A30] border border-[#0A2240] hover:border-[#BF0A30]",
  secondary:
    "bg-[#FDFBF7] text-[#0B0B0F] border border-[#0B0B0F] hover:bg-[#0B0B0F] hover:text-[#FDFBF7]",
  ghost:
    "bg-transparent text-[#0B0B0F] hover:bg-[#0B0B0F]/5 border border-transparent",
  outline:
    "bg-transparent text-[#0A2240] border border-[#0A2240] hover:bg-[#0A2240] hover:text-[#FDFBF7]",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-9 py-4 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-sans font-semibold
        uppercase tracking-[0.12em] transition-colors duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}
      `}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
