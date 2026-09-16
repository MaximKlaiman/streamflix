# Streamflix — remaining work (deadline: Wed Sept 16, 12PM)

## Done
- [x] Fix signup hang (missing `data/` dir + unguarded fetches)
- [x] Gate homepage behind login (landing page for logged-out visitors)
- [x] "Who's Watching" profile picker (add/rename/delete, shared My List)
- [x] Homepage visual pass to match real Netflix (landing page, hero card,
      nav bar, horizontal title cards, hover-expand preview cards, spacing)
- [x] Fixed real bug: Movies/TV Shows/New & Popular nav tabs not updating
      results when clicked while already on the Browse page

## To do, roughly in priority order
- [ ] Visual QA pass with live TMDB data — click every remaining flow (title →
      modal → play; My List add/remove/persist; signup/login edge cases)
- [ ] Fix mobile nav (no hamburger menu below `md` breakpoint — real bug)
- [ ] Decide: Turso swap for persistent My List on a live Vercel deploy
      (only if time remains after the above)
- [ ] Deploy to Vercel (env vars: `TMDB_ACCESS_TOKEN`, `SESSION_SECRET`)
- [ ] Push to GitHub (public repo), email the link per assignment instructions

## Polish (nice-to-have, not blockers)
- [ ] Netflix-style profile icons instead of colored-letter avatars
- [ ] Delete local QA test account (`testclaude-qa@example.com`) from `data/app.db`
