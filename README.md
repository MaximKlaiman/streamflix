# Streamflix — a Netflix homepage clone

Built for the F26 ProductSC Developer Challenge. Recreates the Netflix
browsing experience — hero banner, genre rows, title detail modal, a
play state with a real trailer, search/filter, and a working "My List"
feature behind real authentication.

Named "Streamflix" rather than "Netflix" deliberately: this is a public
repo under my name, and I'd rather it read clearly as a UI/UX homage than
as something that could be confused for the real brand. All data comes
from [TMDB](https://www.themoviedb.org/)'s public API, per the challenge's
own suggested resources.

## What's real vs. what's mocked

Being upfront about this, since it's part of the point of the exercise:

| Piece | Status |
|---|---|
| Movie/show data, posters, cast, ratings | **Real** — live from TMDB |
| Trailers in the "Play" state | **Real** — actual YouTube trailers via TMDB's video API |
| Sign up / log in / sessions | **Real** — bcrypt password hashing, signed JWT session cookies, no mocking |
| "My List" persistence | **Real** — backed by an actual SQL database (SQLite via `better-sqlite3`) |
| Full-length video playback | **Not real** — no service licenses full movies/shows for this; the "Play" button opens the trailer, which is the standard, honest way every clone like this handles it |

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **TMDB API** for all catalog data — proxied through server-only code
  (`src/lib/tmdb.ts`) and Next.js API routes, so the API key never reaches
  the browser
- **better-sqlite3** for a real embedded SQL database (users + My List)
- **bcryptjs** + **jose** for password hashing and signed session cookies
  (no third-party auth provider needed — this works immediately, with
  zero external accounts to set up)

## Running it locally

1. `npm install`
2. Get a free TMDB API key:
   - Sign up at https://www.themoviedb.org/signup
   - Generate a key at https://www.themoviedb.org/settings/api
   - Copy the **API Read Access Token** (the long one)
3. Copy `.env.example` to `.env.local` and fill in:
   ```
   TMDB_ACCESS_TOKEN=your_token_here
   SESSION_SECRET=any_random_string   # e.g. output of `openssl rand -base64 32`
   ```
4. `npm run dev` and open http://localhost:3000

The SQLite database file is created automatically on first run at
`data/app.db` (gitignored — everyone gets a fresh local database).

## The required interactive flow

Browse the homepage → click any title card → **detail modal** opens with
overview, cast, and genres → click **Play** → modal switches to a **playing
state** with the title's real YouTube trailer embedded and a lightweight
player chrome (back button, close button). This same flow works from the
search/browse page and from My List.

## The required data view

`/search` — debounced live search against TMDB, plus a genre filter and a
sort control (Most Popular / Highest Rated / Newest) for browsing without a
search term. Results update via a real API call, not client-side filtering
of a fixed list.

## Notes on deploying (Vercel)

The app deploys to Vercel as-is for the browsing/search/detail-modal
experience. One honest caveat on the auth + My List piece:

Vercel's serverless functions have an **ephemeral, read-only filesystem**,
so a file-based SQLite database will not reliably persist writes across
separate invocations in production (it works perfectly for local dev,
where there's one long-running process). To get persistent My List data on
a live deployment, the smallest change is swapping `better-sqlite3` for a
hosted SQLite-compatible database like [Turso](https://turso.tech) (same
SQL, generous free tier, no native binary) — or any hosted Postgres if
you'd rather change the schema slightly. That's a `src/lib/db.ts` change
only; nothing else in the app needs to know.

I scoped it this way deliberately rather than pre-wiring a hosted DB I
can't personally provision and test — happy to walk through the Turso
swap if useful.

## Known limitations

- **Logout doesn't revoke the JWT server-side.** It clears the cookie the
  browser holds, which is what every real client does correctly, but the
  token itself is stateless and would still verify if someone replayed an
  old cookie value by hand before it expires (30 days). Adding a
  server-side revocation list would fix this but adds real complexity for
  a challenge project — noting the tradeoff rather than hiding it.
- **TMDB doesn't have a trailer for every title.** The play state shows a
  clear "no trailer available" message rather than failing silently.
- Genre filter/sort on `/search` apply to browsing; a free-text search
  query takes priority (TMDB's search endpoint doesn't support combining
  a text query with genre/sort filters).
