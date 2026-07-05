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
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) (bundled with Node)
- Angular CLI (`npm install -g @angular/cli`)
- (optional) [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install) for manual deployments

The Project is located inside the folder `dcit_movie_app`
To view this Angular Project on your local machine:

- Either git clone this repository or download the zip file.
- Open the command prompt inside dcit-Movie-App folder.
- Run the command `npm install`.
- Then run the command `ng serve`.
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

4. Build and deploy:
   ```bash
   npm ci
   npm run build
   wrangler pages deploy dist/movie-viewer --project-name movie-game-viewer
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
