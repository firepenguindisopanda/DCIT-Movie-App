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

3. When running locally `ng serve` will use your `environment.ts`. On the server, `npm run build` executes `node scripts/replace-env.js` which replaces the placeholders in `environment.prod.ts` with the secrets you provided.

4. **Rotate or revoke any keys that were accidentally committed**. See the Git history for past values.

---

### Future Features that can be implemented

- Provide a search button to search for movies by title
- Provide a sort option to sort movies by gross or by studio
- Provide a login in/sign up option for users.
- Add a vote button. The purpose of this button would be to allow a signed in user to vote on which movie they want to watch on that day. With this functionality the app can be used by a group of users to determine what movie they want to watch for a group movie night. The vote button would be limited to one for one active and verified user account. The vote count for an individual movie would be reset at the end of the day. 
