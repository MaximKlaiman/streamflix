"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Play, Plus, Check, ThumbsUp, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { TitleSummary, TitleDetail } from "@/lib/types";
import { useMyList } from "@/lib/useMyList";
import { useAuth } from "@/components/AuthProvider";

function backdropUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w1280${path}` : null;
}

export default function DetailModal({
  title,
  initialMode,
  onClose,
}: {
  title: TitleSummary;
  initialMode: "info" | "playing";
  onClose: () => void;
}) {
  // Tracks whichever title is currently being viewed - starts as the title
  // this modal was opened with, but clicking a "More Like This" item swaps
  // it in place instead of closing and reopening a new modal.
  const [current, setCurrent] = useState(title);
  const [detail, setDetail] = useState<TitleDetail | null>(null);
  const [mode, setMode] = useState<"info" | "playing">(initialMode);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { has, toggle } = useMyList();
  const router = useRouter();
  const inList = has(current.id, current.mediaType);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/tmdb/title/${current.mediaType}/${current.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [current.id, current.mediaType]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleToggleList() {
    if (!user) {
      router.push("/login");
      return;
    }
    await toggle(current);
  }

  function openRelated(t: TitleSummary) {
    setCurrent(t);
    setMode("info");
  }

  const backdrop = backdropUrl(current.backdropPath);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-none bg-nf-black-deep shadow-2xl sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* PLAYING STATE - real YouTube trailer embed with a lightweight player chrome */}
        {mode === "playing" ? (
          <div className="relative aspect-video w-full bg-black">
            {detail?.trailerKey ? (
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${detail.trailerKey}?autoplay=1&rel=0`}
                title={`${current.title} trailer`}
                allow="accelerate-compute; autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-gray-300">
                <p className="text-lg font-medium">No trailer available for {current.title}</p>
                <p className="text-sm text-gray-500">TMDB doesn&apos;t have a YouTube trailer on file for this title.</p>
              </div>
            )}
            <div className="absolute left-0 top-0 flex w-full items-center gap-3 bg-gradient-to-b from-black/80 to-transparent p-4">
              <button
                onClick={() => setMode("info")}
                aria-label="Back to details"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-semibold text-white">{current.title}</span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video w-full bg-zinc-800">
            {backdrop && <Image src={backdrop} alt={current.title} fill className="object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-nf-black-deep via-nf-black-deep/10 to-transparent" />
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X size={20} />
            </button>

            <div className="absolute bottom-6 left-6 right-6">
              {detail?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.logo} alt={current.title} className="mb-3 max-h-16 max-w-[60%] object-contain drop-shadow-lg" />
              ) : (
                <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">{current.title}</h2>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMode("playing")}
                  className="flex items-center gap-2 rounded-full bg-white px-5 py-2 font-semibold text-black transition hover:bg-white/80"
                >
                  <Play size={18} fill="currentColor" />
                  Play
                </button>
                <button
                  onClick={handleToggleList}
                  aria-label={inList ? "Remove from My List" : "Add to My List"}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/50 text-white transition hover:border-white"
                >
                  {inList ? <Check size={18} /> : <Plus size={18} />}
                </button>
                {/* Visual only - Netflix's thumbs feed a recommendation system this app doesn't have */}
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/50 text-white/70">
                  <ThumbsUp size={16} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* INFO PANEL - shown under the backdrop in info mode */}
        {mode === "info" && (
          <div className="p-6">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-1/3 rounded bg-white/10" />
                <div className="h-3 w-full rounded bg-white/10" />
                <div className="h-3 w-5/6 rounded bg-white/10" />
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                      {current.voteAverage > 0 && (
                        <span className="font-semibold text-green-400">
                          {Math.round(current.voteAverage * 10)}% Match
                        </span>
                      )}
                      {current.releaseYear && <span className="text-gray-300">{current.releaseYear}</span>}
                      {detail?.runtime && (
                        <span className="text-gray-300">
                          {Math.floor(detail.runtime / 60)}h {detail.runtime % 60}m
                        </span>
                      )}
                      {detail?.numberOfSeasons && (
                        <span className="text-gray-300">
                          {detail.numberOfSeasons} season{detail.numberOfSeasons > 1 ? "s" : ""}
                        </span>
                      )}
                      {detail?.certification && (
                        <span className="rounded border border-gray-500 px-1.5 text-xs text-gray-300">
                          {detail.certification}
                        </span>
                      )}
                      <span className="rounded border border-gray-500 px-1.5 text-xs text-gray-300">HD</span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-100">{current.overview}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {detail?.genres && detail.genres.length > 0 && (
                      <p className="mb-2">
                        <span className="text-gray-500">Genres: </span>
                        {detail.genres.join(", ")}
                      </p>
                    )}
                    {detail?.cast && detail.cast.length > 0 && (
                      <p>
                        <span className="text-gray-500">Cast: </span>
                        {detail.cast.map((c) => c.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {detail?.similar && detail.similar.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-3 text-xl font-semibold text-white">More Like This</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {detail.similar.map((t) => (
                        <div
                          key={`${t.mediaType}-${t.id}`}
                          onClick={() => openRelated(t)}
                          className="relative aspect-video cursor-pointer overflow-hidden rounded bg-zinc-800 transition hover:scale-105"
                        >
                          {t.backdropPath ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w300${t.backdropPath}`}
                              alt={t.title}
                              fill
                              sizes="300px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-nf-gray-light">
                              {t.title}
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent">
                            <p className="truncate p-2 text-xs font-medium text-white">{t.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
