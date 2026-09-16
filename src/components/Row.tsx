"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TitleCard from "@/components/TitleCard";
import type { TitleSummary } from "@/lib/types";

export default function Row({
  heading,
  items,
  onOpen,
}: {
  heading: string;
  items: TitleSummary[];
  onOpen: (title: TitleSummary, mode?: "info" | "playing") => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  function updateEdges() {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
    setTimeout(updateEdges, 400);
  }

  if (items.length === 0) return null;

  return (
    <div className="group/row relative py-4 sm:py-5">
      <h2 className="mb-3 pl-[22px] pr-4 text-xl font-semibold text-white sm:pl-11 sm:pr-8 md:text-2xl">{heading}</h2>

      <div className="relative">
        {!atStart && (
          <button
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-black/70 to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 sm:flex sm:w-12"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div
          ref={scrollerRef}
          onScroll={updateEdges}
          className="row-scroll flex items-start gap-2 overflow-x-auto scroll-smooth pl-[22px] pr-4 sm:gap-2.5 sm:pl-11 sm:pr-8"
        >
          {items.map((item) => (
            <TitleCard key={`${item.mediaType}-${item.id}`} title={item} onOpen={onOpen} />
          ))}
        </div>

        {!atEnd && (
          <button
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-black/70 to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 sm:flex sm:w-12"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </div>
  );
}
