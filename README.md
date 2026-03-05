[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/firepenguindisopanda/DCIT-Movie-App/tree/search-feature)

# DcitMovieApp

## Purpose of the Application

- Users can browse a collection of movies.
- Users can view the details of an individual movie.
- Users can comment on an individual movie.
- Users can delete comments on any individual movie.
- Users must provide a username and comment to submit a comment

## Instructions

The Project is located inside the folder `dcit_movie_app`
To view this Angular Project on your local machine:

- Either git clone this repository or download the zip file.
- Open the command prompt inside dcit-Movie-App folder.
- Run the command `npm install`.
- Then run the command `ng serve`.
- Open you're browser and navigate to `http://localhost:4200/`, if Angular didn't open a new tab.



### Environment configuration

This application depends on several API keys and URLs, which **must not** be committed to the repo. Instead, an ignored `src/environments/environment.ts` file is used for local development and the `replace-env.js` script injects values during CI builds.

1. Copy `src/environments/environment.example.ts` to `src/environments/environment.ts` and fill in the placeholders:
   ```ts
   RAWG_API_KEY='…'
   SUPABASE_URL='…'
   SUPABASE_KEY='…'
   TMDB_API_KEY='…'
   ```
   `environment.ts` is listed in `.gitignore` so it will not be pushed.

2. Add the corresponding values to a `.env` file (ignored as well) or set them as GitHub Actions secrets. The build script reads the following names:
   * `RAWG_API_KEY`
   * `SUPABASE_URL`
   * `SUPABASE_KEY`
   * `TMDB_API_KEY`

   The GitHub workflow should export them before running `npm run build`.

### Manual Wrangler deployment
If you prefer to deploy by hand instead of using the provided GitHub Action, follow these steps:

1. Install Wrangler globally (if you haven’t already):
   ```bash
   npm install -g wrangler
   ```

2. Obtain a Cloudflare API token with **Pages:Edit** permission.
   * Visit https://dash.cloudflare.com/profile/api-tokens
   * Create a token using the “Cloudflare Pages – Edit” template or a
     custom token granting the same scope.
   * Copy the token; you’ll need it in the next step.

3. Configure your environment variables locally (for building) and for
   wrangler:
   ```bash
   export RAWG_API_KEY=…
   export SUPABASE_URL=…
   export SUPABASE_KEY=…
   export TMDB_API_KEY=…
   export CLOUDFLARE_ACCOUNT_ID=<your-account-id>
   export CLOUDFLARE_API_TOKEN=<the-token-you-just-created>
   ```
   (On Windows use `set` or configure via PowerShell `$env:`.)

4. Build the application:
   ```bash
   npm ci
   npm run build
   ```
   The `npm run build` step uses `scripts/replace-env.js` to inject the
   API keys into `environment.prod.ts` before calling `ng build`.

5. Deploy using wrangler:
   ```bash
   wrangler pages deploy dist/movie-viewer \
     --project-name movie-game-viewer
   ```
   Wrangler will read `CLOUDFLARE_ACCOUNT_ID` and
   `CLOUDFLARE_API_TOKEN` from the environment; if those are missing the
   command will fail with an error similar to the one seen in your
   workflow log.

6. Optionally, you can pass `--branch <name>` to deploy to a preview
   branch.

> When using the GitHub Action, the same variables are supplied via
> secrets; the manual process is equivalent but run on your own machine.

3. When running locally `ng serve` will use your `environment.ts`. On the server, `npm run build` executes `node scripts/replace-env.js` which replaces the placeholders in `environment.prod.ts` with the secrets you provided.

4. **Rotate or revoke any keys that were accidentally committed**. See the Git history for past values.

---

### Future Features that can be implemented

- Provide a search button to search for movies by title
- Provide a sort option to sort movies by gross or by studio
- Provide a login in/sign up option for users.
- Add a vote button. The purpose of this button would be to allow a signed in user to vote on which movie they want to watch on that day. With this functionality the app can be used by a group of users to determine what movie they want to watch for a group movie night. The vote button would be limited to one for one active and verified user account. The vote count for an individual movie would be reset at the end of the day. 
