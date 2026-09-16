"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Play, Plus, Check, ThumbsUp, ChevronDown, Star } from "lucide-react";
import type { TitleSummary, TitleDetail } from "@/lib/types";
import { genreNamesFor } from "@/lib/genreNames";
import { useMyList } from "@/lib/useMyList";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

function backdropUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : null;
}

// How far the expanded card grows beyond its resting size, in pixels.
const GROW_X = 64;
const GROW_TOP = 48;

// Small in-memory cache so re-hovering the same card during this page visit
// doesn't refetch its detail (certification/seasons/runtime) every time.
const detailCache = new Map<string, TitleDetail>();

export default function TitleCard({
  title,
  onOpen,
}: {
  title: TitleSummary;
  onOpen: (title: TitleSummary, mode?: "info" | "playing") => void;
}) {
  const { user } = useAuth();
  const { has, toggle } = useMyList();
  const router = useRouter();
  const inList = has(title.id, title.mediaType);
  const backdrop = backdropUrl(title.backdropPath);
  const genres = genreNamesFor(title.mediaType, title.genreIds);
  const cacheKey = `${title.mediaType}-${title.id}`;

  const placeholderRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [detail, setDetail] = useState<TitleDetail | null>(detailCache.get(cacheKey) ?? null);

  function open() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    const el = placeholderRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width });
    }
    setHovered(true);

    if (!detailCache.has(cacheKey)) {
      fetch(`/api/tmdb/title/${title.mediaType}/${title.id}`)
        .then((r) => r.json())
        .then((data: TitleDetail) => {
          if (!data.id) return;
          detailCache.set(cacheKey, data);
          setDetail(data);
        })
        .catch(() => {});
    }
  }

  function close() {
    closeTimer.current = setTimeout(() => setHovered(false), 120);
  }

  // Rendered via a portal (below) so the expanded card can pop out past the
  // row's own bounds - a horizontally-scrolling row (overflow-x-auto) forces
  // vertical overflow to clip too (a real CSS limitation, not a bug), so a
  // normal in-place expansion always gets cut off or needs reserved empty
  // space between rows. Escaping to a portal lets it cover neighbors freely
  // with no wasted gap when nothing is hovered.
  useEffect(() => {
    if (hovered) {
      const id = requestAnimationFrame(() => setExpanded(true));
      return () => cancelAnimationFrame(id);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded(false);
  }, [hovered]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    await toggle(title);
  }

  const duration =
    title.mediaType === "movie"
      ? detail?.runtime
        ? `${Math.floor(detail.runtime / 60)}h ${detail.runtime % 60}m`
        : null
      : detail?.numberOfSeasons
        ? `${detail.numberOfSeasons} Season${detail.numberOfSeasons > 1 ? "s" : ""}`
        : null;

  return (
    <div
      ref={placeholderRef}
      className="relative w-[200px] shrink-0 sm:w-[250px]"
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-zinc-800">
        {backdrop ? (
          <Image src={backdrop} alt={title.title} fill sizes="250px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-nf-gray-light">
            {title.title}
          </div>
        )}
      </div>

      {hovered &&
        rect &&
        createPortal(
          <div
            onMouseEnter={open}
            onMouseLeave={close}
            onClick={() => onOpen(title)}
            style={{
              position: "fixed",
              top: expanded ? rect.top - GROW_TOP : rect.top,
              left: expanded ? rect.left - GROW_X : rect.left,
              width: expanded ? rect.width + GROW_X * 2 : rect.width,
            }}
            className="z-50 cursor-pointer overflow-hidden rounded-md bg-nf-black-deep shadow-2xl transition-all duration-300 ease-out"
          >
            <div className="relative aspect-video w-full bg-zinc-800">
              {backdrop ? (
                <Image src={backdrop} alt={title.title} fill sizes="380px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-nf-gray-light">
                  {title.title}
                </div>
              )}
            </div>

            {/* Hover info drawer - real data only, no fake watch-progress bar
                since Play only ever opens a trailer, not the actual title,
                so there's no real "amount watched" to show. Certification/
                seasons/runtime load lazily (same detail endpoint the info
                modal uses) since fetching that for every row item upfront
                would be dozens of extra requests per row. */}
            <div className={`grid transition-all duration-300 ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <div className="py-2.5 pl-[17px] pr-3">
                  <p className="truncate text-sm font-semibold text-white">{title.title}</p>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        aria-label="Play"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(title, "playing");
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/80"
                      >
                        <Play size={14} fill="currentColor" />
                      </button>
                      <button
                        aria-label={inList ? "Remove from My List" : "Add to My List"}
                        onClick={handleToggle}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white transition hover:border-white"
                      >
                        {inList ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                      {/* Visual only - Netflix's thumbs feed a recommendation
                          system this app doesn't have, so there's nothing
                          real to record yet. */}
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white/70">
                        <ThumbsUp size={13} />
                      </span>
                    </div>
                    <button
                      aria-label="More info"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(title, "info");
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white transition hover:border-white"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-300">
                    {title.voteAverage > 0 && (
                      <span className="flex items-center gap-0.5 text-green-400">
                        <Star size={11} fill="currentColor" />
                        {title.voteAverage.toFixed(1)}
                      </span>
                    )}
                    {detail?.certification && (
                      <span className="rounded border border-gray-500 px-1 text-[11px]">{detail.certification}</span>
                    )}
                    {duration && <span>{duration}</span>}
                    <span className="rounded border border-gray-500 px-1 text-[11px]">HD</span>
                  </div>

                  {genres.length > 0 && (
                    <div className="mt-1.5 text-xs text-gray-400">
                      {genres.map((g, i) => (
                        <span key={g}>
                          {i > 0 && <span className="text-gray-600"> &bull; </span>}
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
