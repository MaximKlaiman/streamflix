"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import Row from "@/components/Row";
import DetailModal from "@/components/DetailModal";
import type { TitleSummary } from "@/lib/types";

export default function HomeClient({
  hero,
  heroLogo,
  heroGenres,
  rows,
}: {
  hero: TitleSummary;
  heroLogo: string | null;
  heroGenres: string[];
  rows: { heading: string; items: TitleSummary[] }[];
}) {
  const [active, setActive] = useState<{ title: TitleSummary; mode: "info" | "playing" } | null>(null);

  function open(title: TitleSummary, mode: "info" | "playing" = "info") {
    setActive({ title, mode });
  }

  return (
    <>
      <Hero title={hero} logo={heroLogo} genres={heroGenres} onOpen={open} />
      <div className="relative z-10 mt-6 pb-20 sm:mt-10">
        {rows.map((row) => (
          <Row key={row.heading} heading={row.heading} items={row.items} onOpen={open} />
        ))}
      </div>

      {active && (
        <DetailModal title={active.title} initialMode={active.mode} onClose={() => setActive(null)} />
      )}
    </>
  );
}
