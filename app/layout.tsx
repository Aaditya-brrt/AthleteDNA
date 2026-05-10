// Licensed under the Apache License, Version 2.0
import type { Metadata } from "next";
import { Libre_Bodoni, Public_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const libreBodoni = Libre_Bodoni({
  variable: "--font-libre-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Athlete DNA — Discover Your Athlete Archetype",
  description:
    "Discover which of 8 Athlete Archetypes you match from 120 years of Team USA history. Olympic and Paralympic pathways analyzed with equal depth.",
  keywords: ["Team USA", "Olympic", "Paralympic", "athlete", "sports science", "archetype"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${libreBodoni.variable} ${publicSans.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full bg-[#FDFBF7] text-[#0B0B0F]">{children}</body>
    </html>
  );
}
