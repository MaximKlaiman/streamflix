"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import DetailModal from "@/components/DetailModal";
import type { MyListItem, TitleSummary } from "@/lib/types";

export default function MyListClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<MyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<TitleSummary | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/mylist");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch {
      // leave items as-is; the empty/loading state below still resolves
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) load();
  }, [user]);

  async function remove(item: MyListItem) {
    setItems((prev) => prev.filter((i) => !(i.tmdbId === item.tmdbId && i.mediaType === item.mediaType)));
    await fetch(`/api/mylist?tmdbId=${item.tmdbId}&mediaType=${item.mediaType}`, { method: "DELETE" });
  }

  if (authLoading || !user) return <div className="min-h-screen bg-nf-black" />;

  return (
    <div className="min-h-screen bg-nf-black pb-20 pl-[22px] pr-4 pt-24 sm:pl-11 sm:pr-8">
      <h1 className="mb-6 text-2xl font-bold text-white">My List</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-white/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-400">
          Nothing here yet. Add titles from the homepage or browse page by clicking the{" "}
          <span className="text-white">+</span> icon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {items.map((item) => (
            <div key={`${item.mediaType}-${item.tmdbId}`} className="group relative aspect-[2/3] w-full">
              <div
                className="h-full w-full cursor-pointer overflow-hidden rounded-md bg-zinc-800"
                onClick={() =>
                  setActive({
                    id: item.tmdbId,
                    mediaType: item.mediaType as "movie" | "tv",
                    title: item.title,
                    overview: "",
                    posterPath: item.posterPath,
                    backdropPath: null,
                    releaseYear: null,
                    voteAverage: 0,
                    genreIds: [],
                  })
                }
              >
                {item.posterPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-nf-gray-light">
                    {item.title}
                  </div>
                )}
              </div>
              <button
                aria-label={`Remove ${item.title} from My List`}
                onClick={() => remove(item)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {active && (
        <DetailModal title={active} initialMode="info" onClose={() => setActive(null)} />
      )}
    </div>
  );
}
