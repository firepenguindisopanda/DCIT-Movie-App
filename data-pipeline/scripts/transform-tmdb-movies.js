/**
 * Transform TMDB Movies Script
 * Transforms TMDB movie data to Supabase-ready format
 * 
 * Usage: node scripts/transform-tmdb-movies.js
 * 
 * Input: data/tmdb/movies.json, data/tmdb/genres.json
 * Output: data/transformed/movies.json, data/transformed/movie_genres.json
 */

const fs = require('fs');
const path = require('path');

const TMDB_DIR = path.join(__dirname, '../data/tmdb');
const OUTPUT_DIR = path.join(__dirname, '../data/transformed');

function transformMovies() {
  console.log('Transforming TMDB movies...\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Read TMDB data
  const moviesFile = path.join(TMDB_DIR, 'movies.json');
  const genresFile = path.join(TMDB_DIR, 'genres.json');
  
  if (!fs.existsSync(moviesFile)) {
    console.error('Error: TMDB movies data not found.');
    console.error('Run fetch-tmdb-movies.js first!');
    process.exit(1);
  }
  
  const movies = JSON.parse(fs.readFileSync(moviesFile, 'utf-8'));
  const genres = fs.existsSync(genresFile) 
    ? JSON.parse(fs.readFileSync(genresFile, 'utf-8'))
    : [];
  
  console.log(`Input: ${movies.length} movies, ${genres.length} genres`);
  
  // Transform movies to Supabase format
  const transformedMovies = movies.map(movie => ({
    // Use TMDB ID as the primary ID
    tmdb_id: movie.id,
    
    // Titles
    title: movie.title,
    original_title: movie.original_title,
    tagline: movie.tagline,
    
    // Dates
    release_date: movie.release_date,
    year: movie.year,
    
    // Images (already full URLs from fetch script)
    poster_url: movie.poster_path,
    backdrop_url: movie.backdrop_path,
    
    // Overview/Description
    overview: movie.overview,
    
    // Ratings
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    
    // Popularity
    popularity: movie.popularity,
    
    // Metadata
    adult: movie.adult,
    original_language: movie.original_language,
    status: movie.status,
    
    // Genres
    genres: movie.genres,
    
    // Additional details
    runtime: movie.runtime,
    budget: movie.budget,
    revenue: movie.revenue,
    
    // Production (stored as JSON)
    production_companies: JSON.stringify(movie.production_companies || []),
    spoken_languages: JSON.stringify(movie.spoken_languages || []),
    
    // Timestamps
    created_at: new Date().toISOString()
  }));
  
  // Transform genres to Supabase format
  const transformedGenres = genres.map(genre => ({
    id: genre.id,
    name: genre.name,
    created_at: new Date().toISOString()
  }));
  
  // Save transformed data
  const moviesOutput = path.join(OUTPUT_DIR, 'movies.json');
  const genresOutput = path.join(OUTPUT_DIR, 'movie_genres.json');
  
  fs.writeFileSync(moviesOutput, JSON.stringify(transformedMovies, null, 2));
  fs.writeFileSync(genresOutput, JSON.stringify(transformedGenres, null, 2));
  
  // Summary
  console.log('\n=== Transformation Summary ===');
  console.log(`Total movies: ${transformedMovies.length}`);
  console.log(`Movies with posters: ${transformedMovies.filter(m => m.poster_url).length}`);
  console.log(`Movies with backdrops: ${transformedMovies.filter(m => m.backdrop_url).length}`);
  console.log(`Movies with runtime: ${transformedMovies.filter(m => m.runtime).length}`);
  console.log(`Movies with tagline: ${transformedMovies.filter(m => m.tagline).length}`);
  console.log(`Genres: ${transformedGenres.length}`);
  
  console.log('\n=== Output Files ===');
  console.log(`Movies: ${moviesOutput}`);
  console.log(`Genres: ${genresOutput}`);
  
  return { movies: transformedMovies, genres: transformedGenres };
}

// Run if called directly
if (require.main === module) {
  transformMovies();
  console.log('\nTransformation complete!');
}

module.exports = { transformMovies };
