// TMDB's official genre id -> name lists. These are stable, publicly
// documented constants (not fetched), safe to import from client
// components - unlike lib/tmdb.ts, this file has no "server-only" API token.
export const MOVIE_GENRE_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export const TV_GENRE_NAMES: Record<number, string> = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};

export function genreNamesFor(mediaType: "movie" | "tv", genreIds: number[], limit = 3): string[] {
  const map = mediaType === "movie" ? MOVIE_GENRE_NAMES : TV_GENRE_NAMES;
  return genreIds.map((id) => map[id]).filter((name): name is string => !!name).slice(0, limit);
}
