/**
 * Transform Movies Script
 * Transforms raw movie data to Supabase schema format
 * 
 * Usage: node scripts/transform-movies.js
 */

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '../data/raw');
const TRANSFORMED_DIR = path.join(__dirname, '../data/transformed');

function parseGenres(genresString) {
  if (!genresString) return [];
  // Split by newline and clean up
  return genresString
    .split('\n')
    .map(g => g.trim())
    .filter(g => g.length > 0);
}

function transformMovie(movie) {
  return {
    title: movie.title || null,
    year: movie.year ? parseInt(movie.year) : null,
    poster_url: movie.poster_url || null,
    imdb_rating: movie.imdb_rating ? parseFloat(movie.imdb_rating) : null,
    rt_score: movie.rt_score ? parseInt(movie.rt_score) : null,
    worldwide_gross: movie.worldwide_gross || null,
    studio: movie.studio || null,
    rating: movie.rating || null,
    length: movie.length ? parseInt(movie.length) : null,
    // Transform genres from string to array
    genres: parseGenres(movie.genres)
  };
}

function transformMovies() {
  console.log('Transforming movies...');
  
  // Ensure output directory exists
  if (!fs.existsSync(TRANSFORMED_DIR)) {
    fs.mkdirSync(TRANSFORMED_DIR, { recursive: true });
  }

  // Read raw data
  const rawFile = path.join(RAW_DIR, 'movies-all-raw.json');
  if (!fs.existsSync(rawFile)) {
    console.error('Raw movies data not found. Run fetch-movies.js first!');
    process.exit(1);
  }
  
  const rawMovies = JSON.parse(fs.readFileSync(rawFile, 'utf-8'));
  console.log(`Raw movies: ${rawMovies.length}`);

  // Transform each movie
  const transformedMovies = rawMovies.map(transformMovie);

  // Deduplicate by title + year (some movies appear in multiple genres)
  const uniqueMovies = [];
  const seen = new Set();
  
  for (const movie of transformedMovies) {
    if (!movie.title) continue;
    const key = `${movie.title}-${movie.year}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMovies.push(movie);
    }
  }

  // Extract all unique genres
  const allGenres = new Set();
  uniqueMovies.forEach(movie => {
    if (movie.genres) {
      movie.genres.forEach(g => allGenres.add(g));
    }
  });
  const genresArray = Array.from(allGenres).sort().map(name => ({ name }));

  // Save transformed data
  const moviesOutput = path.join(TRANSFORMED_DIR, 'movies.json');
  fs.writeFileSync(moviesOutput, JSON.stringify(uniqueMovies, null, 2));

  const genresOutput = path.join(TRANSFORMED_DIR, 'genres.json');
  fs.writeFileSync(genresOutput, JSON.stringify(genresArray, null, 2));

  console.log(`\nTransformation Summary:`);
  console.log(`  Total movies: ${uniqueMovies.length}`);
  console.log(`  Unique genres: ${genresArray.length}`);
  console.log(`\nOutput files:`);
  console.log(`  - ${moviesOutput}`);
  console.log(`  - ${genresOutput}`);

  return { movies: uniqueMovies, genres: genresArray };
}

// Run if called directly
if (require.main === module) {
  transformMovies();
  console.log('\nMovies transformation complete!');
}

module.exports = { transformMovies };
