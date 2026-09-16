"use client";

import Image from "next/image";
import { Play, Info, Star } from "lucide-react";
import type { TitleSummary } from "@/lib/types";

function backdropUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/original${path}` : null;
}

export default function Hero({
  title,
  logo,
  genres,
  onOpen,
}: {
  title: TitleSummary;
  logo: string | null;
  genres: string[];
  onOpen: (title: TitleSummary, mode?: "info" | "playing") => void;
}) {
  const backdrop = backdropUrl(title.backdropPath);
  const metadata = [
    title.mediaType === "movie" ? "Movie" : "Series",
    title.releaseYear,
    ...genres,
  ].filter(Boolean);

  return (
    <div className="ml-[22px] mr-3 mt-24 overflow-hidden rounded-2xl sm:ml-11 sm:mr-6 sm:mt-28 md:mr-10">
      <div className="relative h-[42vw] max-h-[65vh] min-h-[380px] w-full">
        {backdrop && (
          <Image
            src={backdrop}
            alt={title.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        )}

        {/* Netflix-style gradient for text legibility only - the card is bounded now (rounded box,
            not full-bleed), so the bottom must stay a crisp edge instead of fading into the page. */}
        <div className="absolute inset-0 bg-gradient-to-r from-nf-black via-nf-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute bottom-6 left-4 max-w-xl sm:bottom-8 sm:left-8">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={title.title} className="max-h-24 max-w-[70vw] object-contain drop-shadow-lg sm:max-h-36" />
          ) : (
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl">
              {title.title}
            </h1>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-gray-200 drop-shadow">
            {title.voteAverage > 0 && (
              <span className="flex items-center gap-1 text-green-400">
                <Star size={14} fill="currentColor" />
                {title.voteAverage.toFixed(1)}
              </span>
            )}
            {metadata.map((m, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-500">&bull;</span>}
                {m}
              </span>
            ))}
          </div>

          <p className="mt-4 line-clamp-3 max-w-lg text-sm text-gray-200 drop-shadow sm:text-base md:text-lg">
            {title.overview}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => onOpen(title, "playing")}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2 font-semibold text-black transition hover:bg-white/80 sm:px-6 sm:py-2.5"
            >
              <Play size={20} fill="currentColor" />
              Play
            </button>
            <button
              onClick={() => onOpen(title, "info")}
              className="flex items-center gap-2 rounded-full bg-white/25 px-5 py-2 font-semibold text-white backdrop-blur-sm transition hover:bg-white/35 sm:px-6 sm:py-2.5"
            >
              <Info size={20} />
              More Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
