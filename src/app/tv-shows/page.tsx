import { getTrending, getPopular, getTopRated, getByGenre, getTitleLogo } from "@/lib/tmdb";
import { genreNamesFor } from "@/lib/genreNames";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

// TV genre ids are different from movie genre ids for the same-looking name
// (e.g. "Action & Adventure" is 10759 for TV, not 28 like movie "Action").
const TV_GENRES = {
  actionAdventure: 10759,
  comedy: 35,
  crime: 80,
  documentary: 99,
};

export default async function TvShowsPage() {
  const [trending, popular, topRated, action, comedy, crime, docs] = await Promise.all([
    getTrending("tv"),
    getPopular("tv"),
    getTopRated("tv"),
    getByGenre(TV_GENRES.actionAdventure, "tv"),
    getByGenre(TV_GENRES.comedy, "tv"),
    getByGenre(TV_GENRES.crime, "tv"),
    getByGenre(TV_GENRES.documentary, "tv"),
  ]);

  const hero = trending[0];
  const heroLogo = await getTitleLogo(hero.id, hero.mediaType);
  const heroGenres = genreNamesFor(hero.mediaType, hero.genreIds, 2);

  const rows = [
    { heading: "Trending Now", items: trending.slice(1) },
    { heading: "Popular TV Shows", items: popular },
    { heading: "Top Rated", items: topRated },
    { heading: "Action & Adventure", items: action },
    { heading: "Comedies", items: comedy },
    { heading: "Crime", items: crime },
    { heading: "Documentaries", items: docs },
  ];

  return <HomeClient hero={hero} heroLogo={heroLogo} heroGenres={heroGenres} rows={rows} />;
}
