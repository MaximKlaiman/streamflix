// Server-only TMDB client. Never import this from a client component -
// it reads a secret token from the environment and would leak it to the
// browser bundle otherwise.
import "server-only";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export type MediaType = "movie" | "tv";

export interface Title {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: string | null;
  voteAverage: number;
  genreIds: number[];
}

export interface TitleDetail extends Title {
  runtime: number | null; // minutes for movies
  numberOfSeasons: number | null; // for TV
  genres: string[];
  certification: string | null; // e.g. "PG-13" or "TV-MA", US rating
  logo: string | null; // stylized title logo art, if TMDB has one
  similar: Title[]; // "More Like This" - TMDB's recommendations for this title
  cast: { name: string; character: string; profilePath: string | null }[];
  trailerKey: string | null; // YouTube video id, if a trailer exists
}

function authHeaders(): HeadersInit {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "TMDB_ACCESS_TOKEN is not set. Copy .env.example to .env.local and add your TMDB API Read Access Token."
    );
  }
  return { Authorization: `Bearer ${token}`, accept: "application/json" };
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: authHeaders(),
    // Cache TMDB responses briefly - this is marketing-catalog data, not
    // per-user data, so it's safe (and fast) to reuse across requests.
    next: { revalidate: 60 * 30 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TMDB request failed (${res.status}): ${path} ${body}`);
  }
  return res.json() as Promise<T>;
}

export function posterUrl(path: string | null, size: "w300" | "w500" = "w300") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

// TMDB returns slightly different field names for movie vs tv results
// (title/name, release_date/first_air_date). Normalize to one shape so the
// rest of the app never has to branch on media type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any, mediaType: MediaType): Title {
  return {
    id: raw.id,
    mediaType,
    title: raw.title ?? raw.name ?? "Untitled",
    overview: raw.overview ?? "",
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseYear: (raw.release_date ?? raw.first_air_date ?? "").slice(0, 4) || null,
    voteAverage: raw.vote_average ?? 0,
    genreIds: raw.genre_ids ?? [],
  };
}

export async function getTrending(mediaType: MediaType = "movie") {
  const data = await tmdbFetch<{ results: unknown[] }>(`/trending/${mediaType}/week`);
  return data.results.map((r) => normalize(r, mediaType));
}

export async function getPopular(mediaType: MediaType = "movie") {
  const data = await tmdbFetch<{ results: unknown[] }>(`/${mediaType}/popular`);
  return data.results.map((r) => normalize(r, mediaType));
}

export async function getTopRated(mediaType: MediaType = "movie") {
  const data = await tmdbFetch<{ results: unknown[] }>(`/${mediaType}/top_rated`);
  return data.results.map((r) => normalize(r, mediaType));
}

// Named genres so a browse row can say "Comedy" instead of "Genre 35".
export const GENRES: Record<string, number> = {
  Action: 28,
  Comedy: 35,
  Documentaries: 99,
  Drama: 18,
  Horror: 27,
  "Sci-Fi": 878,
  Animation: 16,
};

export async function getByGenre(genreId: number, mediaType: MediaType = "movie") {
  const data = await tmdbFetch<{ results: unknown[] }>(`/discover/${mediaType}`, {
    with_genres: String(genreId),
    sort_by: "popularity.desc",
  });
  return data.results.map((r) => normalize(r, mediaType));
}

export type SortOption = "popularity.desc" | "vote_average.desc" | "release_date.desc";

export async function searchTitles(query: string, mediaType: MediaType = "movie") {
  if (!query.trim()) return [];
  const data = await tmdbFetch<{ results: unknown[] }>(`/search/${mediaType}`, {
    query,
    include_adult: "false",
  });
  return data.results.map((r) => normalize(r, mediaType));
}

export async function discover(opts: {
  mediaType: MediaType;
  genreId?: number;
  sortBy?: SortOption;
}) {
  const data = await tmdbFetch<{ results: unknown[] }>(`/discover/${opts.mediaType}`, {
    sort_by: opts.sortBy ?? "popularity.desc",
    ...(opts.genreId ? { with_genres: String(opts.genreId) } : {}),
    "vote_count.gte": "50",
  });
  return data.results.map((r) => normalize(r, opts.mediaType));
}

// The hero's stylized logo art (e.g. a show's own logo treatment), used
// instead of a plain text title when TMDB has one - purely decorative, so a
// missing logo or a request hiccup should just fall back to the text title
// rather than break the page.
export async function getTitleLogo(id: number, mediaType: MediaType): Promise<string | null> {
  try {
    const data = await tmdbFetch<{ logos: { file_path: string; iso_639_1: string | null }[] }>(
      `/${mediaType}/${id}/images`,
      { include_image_language: "en,null" }
    );
    const logo = data.logos.find((l) => l.iso_639_1 === "en") ?? data.logos[0];
    return logo ? `${IMAGE_BASE}/w500${logo.file_path}` : null;
  } catch {
    return null;
  }
}

// US certification (e.g. "PG-13" for movies, "TV-MA" for TV) - the two
// endpoints have unrelated shapes, so this normalizes them to one string.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCertification(data: any, mediaType: MediaType): string | null {
  if (mediaType === "movie") {
    const entry = data.release_dates?.results?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => r.iso_3166_1 === "US"
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cert = entry?.release_dates?.find((d: any) => d.certification)?.certification;
    return cert || null;
  }
  const entry = data.content_ratings?.results?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: any) => r.iso_3166_1 === "US"
  );
  return entry?.rating || null;
}

export async function getTitleDetail(id: number, mediaType: MediaType): Promise<TitleDetail> {
  const certAppend = mediaType === "movie" ? "release_dates" : "content_ratings";
  const [data, logo] = await Promise.all([
    tmdbFetch<Record<string, unknown>>(`/${mediaType}/${id}`, {
      append_to_response: `credits,videos,recommendations,${certAppend}`,
    }),
    getTitleLogo(id, mediaType),
  ]);
  const base = normalize(data, mediaType);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const credits = data.credits as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videos = data.videos as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recommendations = data.recommendations as any;

  const trailer = videos?.results?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (v: any) => v.site === "YouTube" && v.type === "Trailer"
  ) ?? videos?.results?.find((v: any) => v.site === "YouTube"); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    ...base,
    runtime: (data.runtime as number) ?? null,
    numberOfSeasons: (data.number_of_seasons as number) ?? null,
    genres: ((data.genres as { name: string }[]) ?? []).map((g) => g.name),
    certification: extractCertification(data, mediaType),
    logo,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    similar: (recommendations?.results ?? []).slice(0, 12).map((r: any) => normalize(r, mediaType)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cast: (credits?.cast ?? []).slice(0, 6).map((c: any) => ({
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
    })),
    trailerKey: trailer?.key ?? null,
  };
}
