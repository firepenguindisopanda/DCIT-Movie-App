[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/firepenguindisopanda/DCIT-Movie-App/tree/search-feature)

# DcitMovieApp

## Purpose of the Application

- Users can browse a collection of movies.
- Users can view the details of an individual movie.
- Users can comment on an individual movie.
- Users can delete comments on any individual movie.
- Users must provide a username and comment to submit a comment

## Instructions

### Prerequisites
Before you begin, make sure you have the following installed on your system:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) **22.x** — `package.json` pins `22.17.1`. Angular 19
  accepts `^18.19.1 || ^20.11.1 || ^22.0.0`; newer majors (24, 26) are rejected by the CLI.
- [npm](https://www.npmjs.com/) (bundled with Node)
- Angular CLI 19 (`npm install -g @angular/cli@19`) — or just use the local one via `npx ng`
- (optional) [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install) for manual deployments

The Project is located inside the folder `dcit_movie_app`
To view this Angular Project on your local machine:

- Either git clone this repository or download the zip file.
- Open the command prompt inside dcit-Movie-App folder.
- Run the command `npm install`.
- Then run the command `npm start` (this injects your `.env` keys, then serves).
- Open you're browser and navigate to `http://localhost:4200/`, if Angular didn't open a new tab.



### Setup

#### 1. Clone and install
```bash
git clone <repo-url>
cd DCIT-Movie-App
npm install
```

#### 2. Configure environment variables
This app depends on several API keys (RAWG, TMDB, Supabase). These **must not** be committed to the repo.

Copy `src/environments/environment.example.ts` to `src/environments/environment.ts`:
```bash
cp src/environments/environment.example.ts src/environments/environment.ts
```

Then open `src/environments/environment.ts` and replace each `YOUR_...` placeholder with your actual keys:

| Variable | Where to get it |
|---|---|
| `RAWG_API_KEY` | [rawg.io/apidocs](https://rawg.io/apidocs) |
| `SUPABASE_URL` | Your Supabase project dashboard → Settings → API |
| `SUPABASE_KEY` | Your Supabase project dashboard → Settings → API (anon public key) |
| `TMDB_API_KEY` | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |

> `environment.ts` is listed in `.gitignore` so it will **not** be committed.

#### 3. Run locally
```bash
ng serve
```

Open `http://localhost:4200/` in your browser.

---

### Movie Night (group voting)

Groups argue about what to watch. This turns that into a vote, across **both**
catalogs — the question is "movie or game tonight?", not just "which movie".

**How it works**
1. Sign in and open **Movie Night** (`/sessions`).
2. Create a session — name it, optionally set a closing time.
3. Add candidates from either catalog. Anyone signed in can suggest.
4. Share the 6-character code (or the copied link). The session page is public,
   so people can read it before signing in; voting requires an account.
5. Everyone gets **one vote**, changeable until closing. Tallies update live via
   Supabase Realtime.
6. The host closes voting and the winner locks in. Ties resolve to whichever
   candidate was suggested first.

**"In the same mood" suggestions**

The session page suggests picks from the *opposite* medium to what is already on
the list. TMDB and RAWG genres are not the same vocabulary — TMDB is thematic
(Crime, Romance, War), RAWG is structural (Platformer, Shooter, Strategy), and
only Action, Adventure and Family appear in both. So a genre-name join finds
almost nothing.

Instead both vocabularies are projected onto seven shared "moods" (high-octane,
epic quest, mind-bender, lighthearted, dark & tense, story-driven, competitive)
and matched by cosine similarity in that space, blended with a quality signal.
See `src/app/services/cross-media.service.ts`.

Known limits, by design:
- RAWG genres carry **no horror or sci-fi signal**, so a horror film returns few
  or no game matches rather than confidently wrong ones. Storing RAWG `tags`
  in the games table would fix this — that's a data-pipeline change.
- Matching reads genres only. It captures mood, not plot.

**Setup:** run `supabase-schema-v4.sql` in the Supabase SQL editor. It is additive
and re-runnable — it does not touch existing tables.

---

### Deployment

#### CI/CD (recommended)
Set the following secrets in your GitHub repository:
- `RAWG_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `TMDB_API_KEY`

The included GitHub Action workflow reads them and injects them via `scripts/replace-env.js` during `npm run build`.

#### Manual Wrangler deployment
1. Install Wrangler globally:
   ```bash
   npm install -g wrangler
   ```

2. Create a Cloudflare API token with **Pages:Edit** permission at https://dash.cloudflare.com/profile/api-tokens.

3. Set environment variables:
   ```bash
   export RAWG_API_KEY=…
   export SUPABASE_URL=…
   export SUPABASE_KEY=…
   export TMDB_API_KEY=…
   export CLOUDFLARE_ACCOUNT_ID=<your-account-id>
   export CLOUDFLARE_API_TOKEN=<your-token>
   ```
   (On Windows use `set` or `$env:` in PowerShell.)

4. Build and deploy. Note the `/browser` suffix: the Angular `application`
   builder emits the browser bundle into a `browser/` subdirectory.
   ```bash
   npm ci
   npm run build
   wrangler pages deploy dist/movie-viewer/browser --project-name movie-game-viewer
   ```

---

### ⚠️ Security notice
If you accidentally committed API keys to Git history, **rotate/revoke them immediately** from the respective dashboards, then scrub the history with `git filter-branch` or `bfg-repo-cleaner`.

---

### Future Features that can be implemented

- Provide a search button to search for movies by title
- Provide a sort option to sort movies by gross or by studio
- Provide a login in/sign up option for users.
- Add a vote button. The purpose of this button would be to allow a signed in user to vote on which movie they want to watch on that day. With this functionality the app can be used by a group of users to determine what movie they want to watch for a group movie night. The vote button would be limited to one for one active and verified user account. The vote count for an individual movie would be reset at the end of the day. 
