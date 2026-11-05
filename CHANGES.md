# Changelog & Roadmap

All changes and upcoming features for Moovies.

---

## TODO

- **Fuzzy Search**: Implement fuzzy matching for search.
- **Login & Auth system**: Provide a light weight login back-end and database so users can create accounts and login. some features would be available to only logged in users.
- **Watchlist & Exclusions**: Allow logged in users to mark titles as "Watched", which save in the Database. and toggle an option in filters to exclude watched titles from search results.
- **AI assistant**: Add a "What to watch" section AI recommendation system. Which is only available to logged in users. they can chat with an AI model about Movie prefrences, genres, mood, or story that they like and get recommendation based on "our" data.
- **Comments**: Edge-based commenting system using Cloudflare Workers and Cloudflare D1 serverless database.

---

## Release History

### v1.0.0 (2026-11-2)

- Updated download links. Added about 7K new titles.
- Moved dataTable from home to /Archive route and designed Home page.
- Added routing. Each page, Home, Archive, About and each title now has it's own route.
- Moved filtering and sorting State to url. now url is the only source of state and UI shows and updates based on that.
- Removed Search component from filters and added it to Header.
- re-designed Search component for mobile and desktop. Added live search.
- Added filter based on year, genres and runtime.
- initial publish on Github.

### v0.7.3 (2026-07-09)

- Updated download links following external source updates.
- Added 30 **NEW** movies.
- Added 17 **NEW** series.

### v0.7.2 (2026-06-22)

- Updated download links.
- Added 383 **NEW** movies.
- Added 240 **NEW** series.

### v0.7.1 (2026-05-06)

- Added 1,577 **NEW** items to the archive.
- Updated download links.

### v0.7.0 (2026-03-26)

- Added Dark Theme with persistent theme toggle in the header.
- Made header sticky and unified mobile filters/sorting for quick access on smaller viewports.

### v0.6.0 (2026-03-20)

- Added filtering by IMDb rating range and vote count threshold.

### v0.5.0 (2026-03-10)

Well, here we go again. War started against Iran, internet is blocked
nationwide and I'm working on updating this project again.

- Added movie/series poster images and redesigned title cards on the home page.
- Expanded database with 193 new movies and 316 new series.
- Fixed pagination reset bug when changing filter criteria.

### v0.4.0 (2026-02-01)

- Added multi-column sorting (rating, votes, release year).
- Redesigned home page title cards, download links modal, and pagination bar.

### v0.3.0 (2026-01-26)

- Added advanced filtering: title type (movies vs. series), subtitle presence, dubbed audio, and keyword search.
- Added full catalog archive view.
- Improved initial bundle and asset load performance.

### v0.2.0 (2026-01-16)

- Added initial title search capability.

### v0.1.0 (2026-01-16)

- Initial launch.
- Built Home, Changes, and About views.
- Indexed top 5,000 movies with direct download links.
