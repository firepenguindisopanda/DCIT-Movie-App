/**
 * Fetch TMDB Movies Script
 * Fetches movies from TMDB API with full details
 * 
 * Usage: node scripts/fetch-tmdb-movies.js
 * 
 * Environment:
 *   TMDB_API_KEY - Your TMDB API Key
 *   TMDB_ACCESS_TOKEN - Your TMDB Read Access Token
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const axios = require('axios');

const OUTPUT_DIR = path.join(__dirname, '../data/tmdb');
const CONFIG_FILE = path.join(OUTPUT_DIR, 'config.json');
const GENRES_FILE = path.join(OUTPUT_DIR, 'genres.json');
const MOVIES_FILE = path.join(OUTPUT_DIR, 'movies.json');

// TMDB API configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Get API key from environment
const API_KEY = process.env.TMDB_API_KEY;
const ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

if (!API_KEY && !ACCESS_TOKEN) {
  console.error('Error: TMDB_API_KEY or TMDB_ACCESS_TOKEN environment variable required');
  console.log('Get your keys from: https://www.themoviedb.org/settings/api');
  process.exit(1);
}

// Configure axios with auth
const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 30000,
  headers: ACCESS_TOKEN 
    ? { Authorization: `Bearer ${ACCESS_TOKEN}` }
    : {}
});

// Add API key to request if using API key auth
tmdb.interceptors.request.use(config => {
  if (API_KEY && !ACCESS_TOKEN) {
    config.params = { ...config.params, api_key: API_KEY };
  }
  return config;
});

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await tmdb.get(url);
      return response.data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (error.response?.status === 429) {
        // Rate limited - wait longer
        console.log('Rate limited, waiting 5 seconds...');
        await new Promise(r => setTimeout(r, 5000));
      } else if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw new Error(`Failed after ${retries} attempts`);
}

async function fetchConfiguration() {
  console.log('Fetching TMDB configuration...');
  const config = await fetchWithRetry('/configuration');
  
  return {
    images: config.images,
    change_keys: config.change_keys
  };
}

async function fetchGenres() {
  console.log('Fetching movie genres...');
  const data = await fetchWithRetry('/genre/movie/list?language=en');
  return data.genres;
}

async function fetchPopularMovies(pages = 10) {
  console.log(`Fetching popular movies (${pages} pages)...`);
  
  const allMovies = [];
  
  for (let page = 1; page <= pages; page++) {
    console.log(`  Fetching page ${page}/${pages}...`);
    const data = await fetchWithRetry(`/movie/popular?page=${page}&language=en`);
    allMovies.push(...data.results);
    
    // Small delay to avoid rate limiting
    if (page < pages) {
      await new Promise(r => setTimeout(r, 250));
    }
  }
  
  return allMovies;
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
        id: c.id,
        name: c.name,
        logo_path: c.logo_path,
        origin_country: c.origin_country
      })) || [],
      spoken_languages: data.spoken_languages?.map(l => ({
        iso_639_1: l.iso_639_1,
        name: l.english_name || l.name
      })) || []
    };
  } catch (error) {
    console.error(`    Failed to fetch details for movie ${movieId}:`, error.message);
    return null;
  }
}

async function fetchAllMovieDetails(movieIds) {
  console.log(`Fetching additional details for ${movieIds.length} movies...`);
  
  const detailsMap = {};
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < movieIds.length; i++) {
    const movieId = movieIds[i];
    
    if (i % 10 === 0) {
      console.log(`  Progress: ${i + 1}/${movieIds.length}...`);
    }
    
    const details = await fetchMovieDetails(movieId);
    if (details) {
      detailsMap[movieId] = details;
      success++;
    } else {
      failed++;
    }
    
    // Delay to avoid rate limiting (TMDB limits)
    if (i < movieIds.length - 1) {
      await new Promise(r => setTimeout(r, 100)); // 100ms between requests
    }
  }
  
  console.log(`  Details fetched: ${success} success, ${failed} failed`);
  return detailsMap;
}

function buildFullMovieData(movies, genresMap, detailsMap, imageConfig) {
  const posterSizes = imageConfig?.poster_sizes || ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'];
  const backdropSizes = imageConfig?.backdrop_sizes || ['w300', 'w780', 'w1280', 'original'];
  
  // Use w500 for poster, w1280 for backdrop
  const posterBase = `${IMAGE_BASE_URL}/w500`;
  const backdropBase = `${IMAGE_BASE_URL}/w1280`;
  
  return movies.map(movie => {
    const details = detailsMap[movie.id] || {};
    
    // Map genre_ids to genre names
    const genreNames = (movie.genre_ids || [])
      .map(id => genresMap[id])
      .filter(Boolean);
    
    return {
      // Basic info
      id: movie.id,
      tmdb_id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview,
      
      // Dates
      release_date: movie.release_date,
      year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
      
      // Images (build full URLs)
      poster_path: movie.poster_path ? `${posterBase}${movie.poster_path}` : null,
      backdrop_path: movie.backdrop_path ? `${backdropBase}${movie.backdrop_path}` : null,
      
      // Ratings & Popularity
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      
      // Metadata
      adult: movie.adult,
      original_language: movie.original_language,
      
      // Genres
      genre_ids: movie.genre_ids,
      genres: genreNames,
      
      // Additional details (from /movie/{id} endpoint)
      runtime: details.runtime || null,
      tagline: details.tagline || null,
      budget: details.budget || null,
      revenue: details.revenue || null,
      status: details.status || null,
      production_companies: details.production_companies || [],
      spoken_languages: details.spoken_languages || []
    };
  });
}

async function main() {
  console.log('=== TMDB Movie Fetcher ===\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Step 1: Fetch configuration
  console.log('\n[1/4] Fetching configuration...');
  const config = await fetchConfiguration();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(`  Saved to: ${CONFIG_FILE}`);
  
  // Step 2: Fetch genres
  console.log('\n[2/4] Fetching genres...');
  const genres = await fetchGenres();
  
  // Create genre ID to name mapping
  const genresMap = {};
  genres.forEach(g => { genresMap[g.id] = g.name; });
  
  const genresOutput = genres.map(g => ({ id: g.id, name: g.name }));
  fs.writeFileSync(GENRES_FILE, JSON.stringify(genresOutput, null, 2));
  console.log(`  Saved ${genres.length} genres to: ${GENRES_FILE}`);
  
  // Step 3: Fetch popular movies
  console.log('\n[3/4] Fetching popular movies...');
  const popularMovies = await fetchPopularMovies(10);
  console.log(`  Fetched ${popularMovies.length} movies`);
  
  // Step 4: Fetch additional details for each movie
  console.log('\n[4/4] Fetching movie details...');
  const movieIds = popularMovies.map(m => m.id);
  const detailsMap = await fetchAllMovieDetails(movieIds);
  
  // Step 5: Build full movie data with full image URLs
  console.log('\n[5/5] Building final dataset...');
  const fullMovies = buildFullMovieData(
    popularMovies, 
    genresMap, 
    detailsMap,
    config.images
  );
  
  // Save movies
  fs.writeFileSync(MOVIES_FILE, JSON.stringify(fullMovies, null, 2));
  console.log(`  Saved ${fullMovies.length} movies to: ${MOVIES_FILE}`);
  
  // Summary
  console.log('\n=== Summary ===');
  console.log(`  Total movies: ${fullMovies.length}`);
  console.log(`  Movies with poster: ${fullMovies.filter(m => m.poster_path).length}`);
  console.log(`  Movies with backdrop: ${fullMovies.filter(m => m.backdrop_path).length}`);
  console.log(`  Movies with runtime: ${fullMovies.filter(m => m.runtime).length}`);
  console.log(`  Movies with tagline: ${fullMovies.filter(m => m.tagline).length}`);
  console.log(`  Genres: ${genres.length}`);
  console.log('\nDone! Files saved to:', OUTPUT_DIR);
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

module.exports = { main, fetchConfiguration, fetchGenres, fetchPopularMovies, fetchMovieDetails };
