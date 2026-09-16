export interface TitleSummary {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: string | null;
  voteAverage: number;
  genreIds: number[];
}

export interface TitleDetail extends TitleSummary {
  runtime: number | null;
  numberOfSeasons: number | null;
  genres: string[];
  certification: string | null;
  logo: string | null;
  similar: TitleSummary[];
  cast: { name: string; character: string; profilePath: string | null }[];
  trailerKey: string | null;
}

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
}

export interface MyListItem {
  tmdbId: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  addedAt: string;
}
