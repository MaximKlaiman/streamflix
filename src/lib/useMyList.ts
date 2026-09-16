"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { TitleSummary } from "@/lib/types";

function key(tmdbId: number, mediaType: string) {
  return `${mediaType}:${tmdbId}`;
}

export function useMyList() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      setLoaded(true);
      return;
    }
    try {
      const res = await fetch("/api/mylist");
      if (!res.ok) return;
      const data = await res.json();
      setIds(new Set(data.items.map((i: { tmdbId: number; mediaType: string }) => key(i.tmdbId, i.mediaType))));
    } catch {
      // Network hiccup - leave whatever My List state we already had rather
      // than clearing it, and try again next time this hook mounts/re-runs.
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    // load() only calls setState after its own async fetch resolves, so this
    // doesn't cause a synchronous cascading render - it re-syncs My List
    // membership whenever the logged-in user changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const has = useCallback((tmdbId: number, mediaType: string) => ids.has(key(tmdbId, mediaType)), [ids]);

  const toggle = useCallback(
    async (title: TitleSummary) => {
      if (!user) return false; // caller should redirect to sign in

      const k = key(title.id, title.mediaType);
      const currentlyIn = ids.has(k);

      // Optimistic update
      setIds((prev) => {
        const next = new Set(prev);
        if (currentlyIn) next.delete(k);
        else next.add(k);
        return next;
      });

      try {
        if (currentlyIn) {
          await fetch(`/api/mylist?tmdbId=${title.id}&mediaType=${title.mediaType}`, { method: "DELETE" });
        } else {
          await fetch("/api/mylist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tmdbId: title.id,
              mediaType: title.mediaType,
              title: title.title,
              posterPath: title.posterPath,
            }),
          });
        }
      } catch {
        // Request failed - roll the optimistic update back so the UI matches
        // what the server actually has.
        setIds((prev) => {
          const next = new Set(prev);
          if (currentlyIn) next.add(k);
          else next.delete(k);
          return next;
        });
      }
      return true;
    },
    [ids, user]
  );

  return { has, toggle, loaded };
}
