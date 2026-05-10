// Licensed under the Apache License, Version 2.0
import { SimulatePageClient } from "./SimulatePageClient";

interface PageProps {
  searchParams: Promise<{ sport?: string }>;
}

export default async function SimulatePage({ searchParams }: PageProps) {
  const { sport } = await searchParams;
  return <SimulatePageClient initialSport={sport ?? null} />;
}
