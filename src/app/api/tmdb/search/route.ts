import { NextRequest, NextResponse } from "next/server";
import { discover, searchTitles, type SortOption, type MediaType } from "@/lib/tmdb";
import { MOVIE_GENRE_NAMES, TV_GENRE_NAMES } from "@/lib/genreNames";

// Movie and TV genres use different TMDB ids for the same-looking name (e.g.
// "Action" is 28 for movies but doesn't exist for TV, which has "Action &
// Adventure" as 10759) - resolve against the map for the requested type.
function genreIdByName(mediaType: MediaType, name: string): number | undefined {
  const map = mediaType === "movie" ? MOVIE_GENRE_NAMES : TV_GENRE_NAMES;
  const entry = Object.entries(map).find(([, n]) => n === name);
  return entry ? Number(entry[0]) : undefined;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = params.get("q")?.trim() ?? "";
  const genreName = params.get("genre") ?? "";
  const sort = (params.get("sort") as SortOption) || "popularity.desc";
  const mediaType: MediaType = params.get("type") === "tv" ? "tv" : "movie";

  try {
    const results = q
      ? await searchTitles(q, mediaType)
      : await discover({ mediaType, genreId: genreIdByName(mediaType, genreName), sortBy: sort });

    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TMDB request failed." },
      { status: 502 }
    );
  }
}
