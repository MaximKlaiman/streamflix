"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import DetailModal from "@/components/DetailModal";
import type { TitleSummary } from "@/lib/types";

const GENRE_OPTIONS = ["All", "Action", "Comedy", "Documentaries", "Drama", "Horror", "Sci-Fi", "Animation"];
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "release_date.desc", label: "Newest" },
];

export default function SearchClient() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [mediaType, setMediaType] = useState(params.get("type") === "tv" ? "tv" : "movie");
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState(
    SORT_OPTIONS.some((s) => s.value === params.get("sort")) ? params.get("sort")! : SORT_OPTIONS[0].value
  );
  const [results, setResults] = useState<TitleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<{ title: TitleSummary; mode: "info" | "playing" } | null>(null);

  // Debounce free-text query so we don't fire a request on every keystroke
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Re-sync from the URL whenever it actually changes (e.g. clicking Movies /
  // TV Shows / New & Popular in the nav while already on this page) - those
  // links only change the query string, and this component doesn't remount
  // for that, so without this the toggle/sort state would silently go stale.
  const paramsKey = params.toString();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMediaType(params.get("type") === "tv" ? "tv" : "movie");
    setSort(SORT_OPTIONS.some((s) => s.value === params.get("sort")) ? params.get("sort")! : SORT_OPTIONS[0].value);
    setQuery(params.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    const url = new URL("/api/tmdb/search", window.location.origin);
    if (debouncedQuery.trim()) url.searchParams.set("q", debouncedQuery.trim());
    if (genre !== "All") url.searchParams.set("genre", genre);
    url.searchParams.set("sort", sort);
    url.searchParams.set("type", mediaType);

    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setResults(data.results ?? []);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError("Something went wrong loading results.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery, genre, sort, mediaType]);

  const heading = useMemo(
    () => (debouncedQuery.trim() ? `Results for "${debouncedQuery.trim()}"` : "Browse"),
    [debouncedQuery]
  );

  return (
    <div className="min-h-screen bg-nf-black pb-20 pl-[22px] pr-4 pt-24 sm:pl-11 sm:pr-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">{heading}</h1>
          <div className="flex gap-1 rounded-full bg-white/5 p-1 text-sm">
            {(["movie", "tv"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMediaType(t)}
                className={`rounded-full px-3 py-1 transition ${
                  mediaType === t ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {t === "movie" ? "Movies" : "TV Shows"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles..."
              className="w-56 rounded border border-white/20 bg-white/5 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-white/50"
            />
          </div>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            disabled={!!debouncedQuery.trim()}
            className="rounded border border-white/20 bg-nf-black-deep px-3 py-2 text-sm text-white outline-none focus:border-white/50 disabled:opacity-40"
          >
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g === "All" ? "All Genres" : g}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            disabled={!!debouncedQuery.trim()}
            className="rounded border border-white/20 bg-nf-black-deep px-3 py-2 text-sm text-white outline-none focus:border-white/50 disabled:opacity-40"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {debouncedQuery.trim() && (
        <p className="mb-4 text-xs text-gray-500">Genre and sort filters apply to Browse; clear search to use them.</p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-md bg-white/5" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="text-gray-400">No titles found. Try a different search or filter.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {results.map((title) => (
            <div key={`${title.mediaType}-${title.id}`} className="w-full">
              <div
                className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-md bg-zinc-800 transition hover:scale-105"
                onClick={() => setActive({ title, mode: "info" })}
              >
                <TitleCardImage title={title} />
              </div>
            </div>
          ))}
        </div>
      )}

      {active && (
        <DetailModal title={active.title} initialMode={active.mode} onClose={() => setActive(null)} />
      )}
    </div>
  );
}

function TitleCardImage({ title }: { title: TitleSummary }) {
  const backdrop = title.backdropPath ? `https://image.tmdb.org/t/p/w500${title.backdropPath}` : null;
  return backdrop ? (
    // Plain img here keeps this grid cell simple since layout is grid-controlled, not fixed width like the rows
    // eslint-disable-next-line @next/next/no-img-element
    <img src={backdrop} alt={title.title} className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-nf-gray-light">
      {title.title}
    </div>
  );
}
