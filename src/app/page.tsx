import { redirect } from "next/navigation";
import { getTrending, getPopular, getTopRated, getByGenre, GENRES, posterUrl, getTitleLogo } from "@/lib/tmdb";
import HomeClient from "@/components/HomeClient";
import LandingClient from "@/components/LandingClient";
import { getSessionUserId } from "@/lib/auth";
import { getActiveProfileId } from "@/lib/profile";

// Rendered per-request rather than statically at build time (this repo's
// build environment may not have network access to TMDB); the underlying
// TMDB fetches are still cached for 30 minutes via lib/tmdb.ts.
export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await getSessionUserId();
  if (!userId) {
    // Real posters for the background collage - the same TMDB data the app
    // already shows post-login, just used as decoration here instead of rows.
    const popular = await getPopular("movie");
    const posters = popular.map((p) => posterUrl(p.posterPath)).filter((url): url is string => !!url);
    return <LandingClient posters={posters} />;
  }

  const profileId = await getActiveProfileId(userId);
  if (!profileId) redirect("/whos-watching");

  const [trending, popular, topRated, action, comedy, docs, horror] = await Promise.all([
    getTrending("movie"),
    getPopular("movie"),
    getTopRated("movie"),
    getByGenre(GENRES.Action, "movie"),
    getByGenre(GENRES.Comedy, "movie"),
    getByGenre(GENRES.Documentaries, "movie"),
    getByGenre(GENRES.Horror, "movie"),
  ]);

  // Pick the hero from the top of trending - the closest analog to Netflix's
  // "featured this week" billboard slot.
  const hero = trending[0];
  const heroLogo = await getTitleLogo(hero.id, hero.mediaType);
  const genreNames = Object.fromEntries(Object.entries(GENRES).map(([name, id]) => [id, name]));
  const heroGenres = hero.genreIds.map((id) => genreNames[id]).filter(Boolean).slice(0, 2);

  const rows = [
    { heading: "Trending Now", items: trending.slice(1) },
    { heading: "Popular on Streamflix", items: popular },
    { heading: "Top Rated", items: topRated },
    { heading: "Action & Adventure", items: action },
    { heading: "Comedies", items: comedy },
    { heading: "Documentaries", items: docs },
    { heading: "Horror", items: horror },
  ];

  return <HomeClient hero={hero} heroLogo={heroLogo} heroGenres={heroGenres} rows={rows} />;
}
