const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const OUTPUT_DIR = path.join(__dirname, '../data/tmdb');
const CONFIG_FILE = path.join(OUTPUT_DIR, 'config.json');
const GENRES_FILE = path.join(OUTPUT_DIR, 'genres.json');
const MOVIES_FILE = path.join(OUTPUT_DIR, 'movies.json');

const API_KEY = process.env.TMDB_API_KEY;
const ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

if (!API_KEY && !ACCESS_TOKEN) {
  console.error('TMDB_API_KEY or TMDB_ACCESS_TOKEN required');
  process.exit(1);
}

const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 30000,
  headers: ACCESS_TOKEN ? { Authorization: `Bearer ${ACCESS_TOKEN}` } : {}
});

tmdb.interceptors.request.use(config => {
  if (API_KEY && !ACCESS_TOKEN) {
    config.params = { ...config.params, api_key: API_KEY };
  }
  return config;
});

const CATEGORIES = [
  { name: 'Top Rated',            endpoint: '/movie/top_rated',                    params: {},                                                        pages: 20 },
  { name: 'Now Playing',          endpoint: '/movie/now_playing',                  params: {},                                                        pages: 3 },
  { name: 'Upcoming',             endpoint: '/movie/upcoming',                     params: {},                                                        pages: 3 },
  { name: 'Action',               endpoint: '/discover/movie',                     params: { with_genres: '28' },                                    pages: 3 },
  { name: 'Comedy',               endpoint: '/discover/movie',                     params: { with_genres: '35' },                                    pages: 3 },
  { name: 'Drama',                endpoint: '/discover/movie',                     params: { with_genres: '18' },                                    pages: 3 },
  { name: 'Horror',               endpoint: '/discover/movie',                     params: { with_genres: '27' },                                    pages: 3 },
  { name: 'Sci-Fi',               endpoint: '/discover/movie',                     params: { with_genres: '878' },                                   pages: 3 },
  { name: 'Romance',              endpoint: '/discover/movie',                     params: { with_genres: '10749' },                                  pages: 3 },
  { name: 'Thriller',             endpoint: '/discover/movie',                     params: { with_genres: '53' },                                    pages: 3 },
  { name: 'Animation',            endpoint: '/discover/movie',                     params: { with_genres: '16' },                                    pages: 3 },
  { name: 'Documentary',          endpoint: '/discover/movie',                     params: { with_genres: '99' },                                    pages: 3 },
  { name: 'Mystery',              endpoint: '/discover/movie',                     params: { with_genres: '9648' },                                  pages: 3 },
  { name: '80s',                  endpoint: '/discover/movie',                     params: { 'primary_release_date.gte': '1980-01-01', 'primary_release_date.lte': '1989-12-31', sort_by: 'popularity.desc' }, pages: 3 },
  { name: '90s',                  endpoint: '/discover/movie',                     params: { 'primary_release_date.gte': '1990-01-01', 'primary_release_date.lte': '1999-12-31', sort_by: 'popularity.desc' }, pages: 3 },
  { name: '2000s',                endpoint: '/discover/movie',                     params: { 'primary_release_date.gte': '2000-01-01', 'primary_release_date.lte': '2009-12-31', sort_by: 'popularity.desc' }, pages: 3 },
  { name: '2010s',                endpoint: '/discover/movie',                     params: { 'primary_release_date.gte': '2010-01-01', 'primary_release_date.lte': '2019-12-31', sort_by: 'popularity.desc' }, pages: 3 },
  { name: 'Highest Grossing',     endpoint: '/discover/movie',                     params: { sort_by: 'revenue.desc', 'vote_count.gte': '100' },      pages: 5 },
  { name: 'French Cinema',        endpoint: '/discover/movie',                     params: { with_original_language: 'fr', sort_by: 'vote_average.desc', 'vote_count.gte': '200' }, pages: 3 },
  { name: 'International',        endpoint: '/discover/movie',                     params: { with_original_language: 'ko,ja,hi,zh,es,it,de', sort_by: 'vote_average.desc', 'vote_count.gte': '100' }, pages: 4 },
];

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await tmdb.get(url);
      return response.data;
    } catch (error) {
      console.error(`  Attempt ${i + 1} failed:`, error.message);
      if (error.response?.status === 429) {
        console.log('  Rate limited, waiting 5s...');
        await new Promise(r => setTimeout(r, 5000));
      } else if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw new Error(`Failed after ${retries} attempts`);
}

async function fetchCategoryPages(name, endpoint, baseParams, pageCount) {
  console.log(`\n  [${name}] Fetching ${pageCount} pages...`);
  const movies = [];
  for (let page = 1; page <= pageCount; page++) {
    try {
      const params = new URLSearchParams({ ...baseParams, page: String(page) }).toString();
      const data = await fetchWithRetry(`${endpoint}?${params}`);
      movies.push(...(data.results || []));
      console.log(`    Page ${page}/${pageCount} — ${data.results?.length || 0} movies`);
    } catch (e) {
      console.error(`    Failed page ${page}: ${e.message}`);
    }
    if (page < pageCount) await new Promise(r => setTimeout(r, 350));
  }
  return movies;
}

async function fetchMovieDetails(movieId) {
  try {
    const data = await fetchWithRetry(`/movie/${movieId}?language=en`);
    return {
      runtime: data.runtime,
      tagline: data.tagline,
      budget: data.budget,
      revenue: data.revenue,
      status: data.status,
      production_companies: data.production_companies?.map(c => ({
        id: c.id, name: c.name, logo_path: c.logo_path, origin_country: c.origin_country
      })) || [],
      spoken_languages: data.spoken_languages?.map(l => ({
        iso_639_1: l.iso_639_1, name: l.english_name || l.name
      })) || []
    };
  } catch {
    return null;
  }
}

function buildFullMovieData(movies, genresMap) {
  const seen = new Set();
  const posterBase = `${IMAGE_BASE_URL}/w500`;
  const backdropBase = `${IMAGE_BASE_URL}/w1280`;

  return movies.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  }).map(movie => {
    const genreNames = (movie.genre_ids || []).map(id => genresMap[id]).filter(Boolean);
    return {
      id: movie.id,
      tmdb_id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview,
      release_date: movie.release_date,
      year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
      poster_path: movie.poster_path ? `${posterBase}${movie.poster_path}` : null,
      backdrop_path: movie.backdrop_path ? `${backdropBase}${movie.backdrop_path}` : null,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      adult: movie.adult,
      original_language: movie.original_language,
      genre_ids: movie.genre_ids,
      genres: genreNames,
      runtime: movie._details?.runtime || null,
      tagline: movie._details?.tagline || null,
      budget: movie._details?.budget || null,
      revenue: movie._details?.revenue || null,
      status: movie._details?.status || null,
      production_companies: movie._details?.production_companies || [],
      spoken_languages: movie._details?.spoken_languages || []
    };
  });
}

async function main() {
  console.log('=== TMDB Comprehensive Movie Fetcher ===\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Fetch configuration
  console.log('[1/6] Fetching TMDB configuration...');
  const config = await fetchWithRetry('/configuration');
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(`  Saved to: ${CONFIG_FILE}`);

  // 2. Fetch genres
  console.log('\n[2/6] Fetching genres...');
  const genreData = await fetchWithRetry('/genre/movie/list?language=en');
  const genres = genreData.genres;
  const genresMap = {};
  genres.forEach(g => { genresMap[g.id] = g.name; });
  fs.writeFileSync(GENRES_FILE, JSON.stringify(genres, null, 2));
  console.log(`  Saved ${genres.length} genres`);

  // 3. Fetch from all categories
  console.log('\n[3/6] Fetching movies from all categories...');
  const seenIds = new Set();
  const allMovies = [];

  for (const cat of CATEGORIES) {
    const movies = await fetchCategoryPages(cat.name, cat.endpoint, cat.params, cat.pages);
    const newMovies = movies.filter(m => {
      if (seenIds.has(m.id)) return false;
      seenIds.add(m.id);
      return true;
    });
    allMovies.push(...newMovies);
    console.log(`    → ${newMovies.length} new (${seenIds.size} unique total)`);
  }

  console.log(`\n  Total unique movies: ${allMovies.length}`);

  // 4. Fetch details
  console.log('\n[4/6] Fetching movie details...');
  const detailsMap = {};
  let success = 0;

  for (let i = 0; i < allMovies.length; i++) {
    const movie = allMovies[i];
    if (i % 20 === 0) {
      console.log(`  Progress: ${i + 1}/${allMovies.length}...`);
    }
    const details = await fetchMovieDetails(movie.id);
    if (details) {
      movie._details = details;
      success++;
    }
    if (i < allMovies.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  console.log(`  Details fetched: ${success}/${allMovies.length}`);

  // 5. Build final dataset
  console.log('\n[5/6] Building final dataset...');
  const fullMovies = buildFullMovieData(allMovies, genresMap);
  fs.writeFileSync(MOVIES_FILE, JSON.stringify(fullMovies, null, 2));
  console.log(`  Saved ${fullMovies.length} movies to: ${MOVIES_FILE}`);

  // 6. Summary
  console.log('\n[6/6] === Summary ===');
  const withPoster = fullMovies.filter(m => m.poster_path).length;
  const withBackdrop = fullMovies.filter(m => m.backdrop_path).length;
  const withRuntime = fullMovies.filter(m => m.runtime).length;
  const withTagline = fullMovies.filter(m => m.tagline).length;
  console.log(`  Total movies: ${fullMovies.length}`);
  console.log(`  With poster: ${withPoster}`);
  console.log(`  With backdrop: ${withBackdrop}`);
  console.log(`  With runtime: ${withRuntime}`);
  console.log(`  With tagline: ${withTagline}`);
  console.log(`  Genres: ${genres.length}`);

  // Per-language breakdown
  const langCounts = {};
  fullMovies.forEach(m => {
    const lang = m.original_language || 'unknown';
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  });
  console.log(`\n  Language breakdown:`);
  Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([lang, count]) => console.log(`    ${lang}: ${count} movies`));

  // Year range
  const years = fullMovies.map(m => m.year).filter(Boolean);
  if (years.length) {
    console.log(`\n  Year range: ${Math.min(...years)} – ${Math.max(...years)}`);
  }

  console.log('\nDone!');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { main, CATEGORIES };
