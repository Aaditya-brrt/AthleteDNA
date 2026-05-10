// Licensed under the Apache License, Version 2.0
"use client";

import { useEffect, useState } from "react";

interface TypewriterTextProps {
  text: string;
  delay?: number;
  className?: string;
  onDone?: () => void;
}

export function TypewriterText({ text, delay = 30, className = "", onDone }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, delay);
    return () => clearInterval(interval);
  }, [text, delay, onDone]);

  return (
    <span className={className}>
      {displayed}
      <span className="inline-block w-[3px] h-[0.9em] bg-[#BF0A30] ml-1 align-middle animate-pulse" />
    </span>
  );
}
