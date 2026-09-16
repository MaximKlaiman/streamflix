import { getTrending, getPopular, getTopRated, getByGenre, GENRES, getTitleLogo } from "@/lib/tmdb";
import { genreNamesFor } from "@/lib/genreNames";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
  const [trending, popular, topRated, action, comedy, docs, horror] = await Promise.all([
    getTrending("movie"),
    getPopular("movie"),
    getTopRated("movie"),
    getByGenre(GENRES.Action, "movie"),
    getByGenre(GENRES.Comedy, "movie"),
    getByGenre(GENRES.Documentaries, "movie"),
    getByGenre(GENRES.Horror, "movie"),
  ]);

  const hero = trending[0];
  const heroLogo = await getTitleLogo(hero.id, hero.mediaType);
  const heroGenres = genreNamesFor(hero.mediaType, hero.genreIds, 2);

  const rows = [
    { heading: "Trending Now", items: trending.slice(1) },
    { heading: "Popular Movies", items: popular },
    { heading: "Top Rated", items: topRated },
    { heading: "Action & Adventure", items: action },
    { heading: "Comedies", items: comedy },
    { heading: "Documentaries", items: docs },
    { heading: "Horror", items: horror },
  ];

  return <HomeClient hero={hero} heroLogo={heroLogo} heroGenres={heroGenres} rows={rows} />;
}
