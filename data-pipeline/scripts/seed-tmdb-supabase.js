/**
 * Seed TMDB Supabase Script
 * Seeds TMDB movie data to Supabase
 * 
 * Usage: node scripts/seed-tmdb-supabase.js
 * 
 * Requires environment variables:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_KEY - Your Supabase service role key (for admin access)
 * 
 * Or use .env file in data-pipeline/
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TRANSFORMED_DIR = path.join(__dirname, '../data/transformed');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables required');
  console.error('\nGet these from your Supabase dashboard:');
  console.error('  - SUPABASE_URL: Settings → API → Project URL');
  console.error('  - SUPABASE_SERVICE_KEY: Settings → API → service_role key');
  process.exit(1);
}

// Create Supabase client with service role key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedGenres() {
  console.log('\n[1/3] Seeding movie genres...');
  
  const genresFile = path.join(TRANSFORMED_DIR, 'movie_genres.json');
  if (!fs.existsSync(genresFile)) {
    console.error('Error: movie_genres.json not found. Run transform-tmdb-movies.js first!');
    return false;
  }
  
  const genres = JSON.parse(fs.readFileSync(genresFile, 'utf-8'));
  console.log(`  Found ${genres.length} genres to insert`);
  
  // Clear existing genres and insert new ones
  const { error: deleteError } = await supabase.from('movie_genres').delete().neq('id', 0);
  if (deleteError) {
    console.error('  Error clearing genres:', deleteError.message);
    return false;
  }
  
  const { error: insertError } = await supabase.from('movie_genres').insert(genres);
  if (insertError) {
    console.error('  Error inserting genres:', insertError.message);
    return false;
  }
  
  console.log(`  ✓ Inserted ${genres.length} genres`);
  return true;
}

async function seedMovies() {
  console.log('\n[2/3] Seeding movies...');
  
  const moviesFile = path.join(TRANSFORMED_DIR, 'movies.json');
  if (!fs.existsSync(moviesFile)) {
    console.error('Error: movies.json not found. Run transform-tmdb-movies.js first!');
    return false;
  }
  
  let movies = JSON.parse(fs.readFileSync(moviesFile, 'utf-8'));
  console.log(`  Found ${movies.length} movies to insert`);
  
  // Clear existing movies
  const { error: deleteError } = await supabase.from('movies').delete().neq('tmdb_id', 0);
  if (deleteError) {
    console.error('  Error clearing movies:', deleteError.message);
  }
  
  // Deduplicate by tmdb_id
  const seen = new Set();
  movies = movies.filter(m => {
    if (seen.has(m.tmdb_id)) return false;
    seen.add(m.tmdb_id);
    return true;
  });
  console.log(`  After deduplication: ${movies.length} unique movies`);
  
  // Insert one by one to handle any remaining conflicts
  let inserted = 0;
  
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const { error } = await supabase.from('movies').upsert(movie, { onConflict: 'tmdb_id' });
    
    if (!error) {
      inserted++;
      if ((i + 1) % 50 === 0) {
        console.log(`  Inserted ${inserted}/${movies.length}...`);
      }
    }
  }
  
  console.log(`  ✓ Inserted ${inserted} movies`);
  return inserted > 0;
}

async function verifyData() {
  console.log('\n[3/3] Verifying data...');
  
  // Check genres
  const { data: genres, error: genresError } = await supabase
    .from('movie_genres')
    .select('count', { count: 'exact' });
  
  if (genresError) {
    console.error('  Error checking genres:', genresError.message);
  } else {
    console.log(`  ✓ Movie genres: ${genres[0]?.count || 0}`);
  }
  
  // Check movies
  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('count', { count: 'exact' });
  
  if (moviesError) {
    console.error('  Error checking movies:', moviesError.message);
  } else {
    console.log(`  ✓ Movies: ${movies[0]?.count || 0}`);
  }
  
  // Sample movie
  const { data: sample } = await supabase
    .from('movies')
    .select('title, poster_url, vote_average, runtime')
    .limit(1)
    .single();
  
  if (sample) {
    console.log(`\n  Sample movie: "${sample.title}"`);
    console.log(`    - Rating: ${sample.vote_average}`);
    console.log(`    - Runtime: ${sample.runtime} min`);
    console.log(`    - Poster: ${sample.poster_url ? 'Yes' : 'No'}`);
  }
}

async function main() {
  console.log('=== TMDB Supabase Seeder ===\n');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  
  const genresResult = await seedGenres();
  const moviesResult = await seedMovies();
  
  if (genresResult && moviesResult) {
    await verifyData();
    console.log('\n=== Seeding Complete! ===');
  } else {
    console.error('\n=== Seeding Failed ===');
    process.exit(1);
  }
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

module.exports = { seedGenres, seedMovies, verifyData };
