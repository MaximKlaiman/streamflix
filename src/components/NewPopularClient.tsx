"use client";

import { useState } from "react";
import Row from "@/components/Row";
import DetailModal from "@/components/DetailModal";
import type { TitleSummary } from "@/lib/types";

export default function NewPopularClient({
  rows,
}: {
  rows: { heading: string; items: TitleSummary[] }[];
}) {
  const [active, setActive] = useState<{ title: TitleSummary; mode: "info" | "playing" } | null>(null);

  function open(title: TitleSummary, mode: "info" | "playing" = "info") {
    setActive({ title, mode });
  }

  return (
    <div className="min-h-screen bg-nf-black pb-20 pt-24">
      <h1 className="mb-2 pl-[22px] pr-4 text-2xl font-bold text-white sm:pl-11 sm:pr-8">New &amp; Popular</h1>
      {rows.map((row) => (
        <Row key={row.heading} heading={row.heading} items={row.items} onOpen={open} />
      ))}

      {active && (
        <DetailModal title={active.title} initialMode={active.mode} onClose={() => setActive(null)} />
      )}
    </div>
  );
}
