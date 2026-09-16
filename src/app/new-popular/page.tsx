import { discover } from "@/lib/tmdb";
import NewPopularClient from "@/components/NewPopularClient";

export const dynamic = "force-dynamic";

export default async function NewPopularPage() {
  const [newMovies, popularMovies, newTv, popularTv] = await Promise.all([
    discover({ mediaType: "movie", sortBy: "release_date.desc" }),
    discover({ mediaType: "movie", sortBy: "popularity.desc" }),
    discover({ mediaType: "tv", sortBy: "release_date.desc" }),
    discover({ mediaType: "tv", sortBy: "popularity.desc" }),
  ]);

  const rows = [
    { heading: "New Movies", items: newMovies },
    { heading: "Popular Movies", items: popularMovies },
    { heading: "New TV Shows", items: newTv },
    { heading: "Popular TV Shows", items: popularTv },
  ];

  return <NewPopularClient rows={rows} />;
}
