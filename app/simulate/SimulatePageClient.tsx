// Licensed under the Apache License, Version 2.0
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAthleteStore } from "@/store/athleteStore";
import { getArchetypeById } from "@/lib/archetypes";
import { Navbar } from "@/components/layout/Navbar";
import { SimulateTab } from "@/components/profile/SimulateTab";
import { Button } from "@/components/ui/Button";

interface SimulatePageClientProps {
  initialSport: string | null;
}

export function SimulatePageClient({ initialSport }: SimulatePageClientProps) {
  const { classificationResult, setSelectedSport } = useAthleteStore();

  useEffect(() => {
    if (initialSport) setSelectedSport(initialSport);
  }, [initialSport, setSelectedSport]);

  if (!classificationResult) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center space-y-4">
          <div className="text-[#52525B]">No archetype data found.</div>
          <Link href="/intake">
            <Button>Start Over</Button>
          </Link>
        </div>
      </main>
    );
  }

  const archetype = getArchetypeById(classificationResult.archetype_id);
  const color = archetype?.color ?? "#0A2240";

  return (
    <main className="relative min-h-screen bg-[#FDFBF7]">
      <Navbar showBackTo={{ href: "/profile", label: "Back to Profile" }} />
      <div className="max-w-5xl mx-auto pt-32 px-8 pb-20 space-y-8">
        <header className="space-y-3 border-b border-[#0B0B0F] pb-6">
          <div className="kicker">Standalone Simulation</div>
          <h1 className="font-display text-5xl font-semibold tracking-tight" style={{ color }}>
            {classificationResult.archetype}
          </h1>
        </header>
        <SimulateTab archetypeColor={color} archetypeId={classificationResult.archetype_id} />
      </div>
    </main>
  );
}
