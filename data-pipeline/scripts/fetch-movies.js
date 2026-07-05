/**
 * Fetch Movies Script
 * Fetches all movies from weblabs API and saves to JSON
 * 
 * Data Source: https://weblabs.web.app/api/movies/
 * 
 * Usage: node scripts/fetch-movies.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'https://weblabs.web.app/api/movies';
const OUTPUT_DIR = path.join(__dirname, '../data/raw');
const INDEX_FILE = path.join(OUTPUT_DIR, 'movies-index.json');
const GENRES_DIR = path.join(OUTPUT_DIR, 'movies-by-genre');

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

async function fetchAllMovies() {
  console.log('Fetching movies index...');
  
  // Ensure directories exist
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(GENRES_DIR)) fs.mkdirSync(GENRES_DIR, { recursive: true });

  // Fetch index to get all genres
  const index = await fetchWithRetry(`${BASE_URL}/index.json`);
  
  // Save index
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  console.log(`Saved movies index with ${Object.keys(index).length} genres`);

  // Fetch each genre
  const genres = Object.keys(index);
  console.log(`\nFetching movies from ${genres.length} genres...`);
  
  const allMovies = [];
  let successCount = 0;
  let failCount = 0;

  for (const genre of genres) {
    const genreInfo = index[genre];
    const genreFileName = `${genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    const genreFilePath = path.join(GENRES_DIR, genreFileName);
    
    try {
      console.log(`  Fetching ${genre}...`);
      const movies = await fetchWithRetry(genreInfo.url);
      
      // Add genre to each movie
      const moviesWithGenre = movies.map(movie => ({
        ...movie,
        _genre_source: genre
      }));
      
      // Save genre file
      fs.writeFileSync(genreFilePath, JSON.stringify(moviesWithGenre, null, 2));
      
      allMovies.push(...moviesWithGenre);
      successCount++;
    } catch (error) {
      console.error(`  Failed to fetch ${genre}:`, error.message);
      failCount++;
    }
  }

  // Save combined raw data
  const rawOutput = path.join(OUTPUT_DIR, 'movies-all-raw.json');
  fs.writeFileSync(rawOutput, JSON.stringify(allMovies, null, 2));

  console.log(`\nSummary:`);
  console.log(`   Total movies fetched: ${allMovies.length}`);
  console.log(`   Genres success: ${successCount}`);
  console.log(`   Genres failed: ${failCount}`);
  console.log(`\nFiles saved to: ${OUTPUT_DIR}`);
  
  return allMovies;
}

// Run if called directly
if (require.main === module) {
  fetchAllMovies()
    .then(() => {
      console.log('\nMovies fetch complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nError:', error.message);
      process.exit(1);
    });
}

module.exports = { fetchAllMovies };
