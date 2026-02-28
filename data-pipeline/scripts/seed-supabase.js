/**
 * Seed Supabase Script
 * Seeds the database with movies, games, genres, and test users
 * 
 * Usage: node scripts/seed-supabase.js
 * 
 * Note: Run supabase-seed-fix.sql first to enable INSERT policies!
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration - Update these or use environment variables
const TRANSFORMED_DIR = path.join(__dirname, '../data/transformed');

// Get Supabase credentials from environment or use defaults
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_KEY environment variable is required');
  console.log('   Set it with: export SUPABASE_KEY=your_anon_key');
  console.log('   Or edit data-pipeline/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test user credentials (these will be created)
// Using valid-looking emails that Supabase will accept
const TEST_USERS = [
  { email: 'testuser1@demo.local', password: 'TestPassword123!' },
  { email: 'testuser2@demo.local', password: 'TestPassword123!' },
  { email: 'demouser@demo.local', password: 'DemoPassword123!' }
];

async function seedGenres() {
  console.log('\nSeeding genres...');
  
  const file = path.join(TRANSFORMED_DIR, 'genres.json');
  if (!fs.existsSync(file)) {
    console.error('genres.json not found. Run transform-movies.js first!');
    return;
  }
  
  const genres = JSON.parse(fs.readFileSync(file, 'utf-8'));
  
  // Insert genres
  const { data, error } = await supabase
    .from('genres')
    .upsert(genres, { onConflict: 'name', ignoreDuplicates: true })
    .select();
  
  if (error) {
    console.error('Error seeding genres:', error.message);
  } else {
    console.log(`   Seeded ${genres.length} movie genres`);
  }
  
  return { genres, error };
}

async function seedGameGenres() {
  console.log('\nSeeding game genres...');
  
  const file = path.join(TRANSFORMED_DIR, 'game-genres.json');
  if (!fs.existsSync(file)) {
    console.error('game-genres.json not found. Run transform-games.js first!');
    return;
  }
  
  const gameGenres = JSON.parse(fs.readFileSync(file, 'utf-8'));
  
  // Insert game genres
  const { data, error } = await supabase
    .from('game_genres')
    .upsert(gameGenres, { onConflict: 'name', ignoreDuplicates: true })
    .select();
  
  if (error) {
    console.error('Error seeding game genres:', error.message);
  } else {
    console.log(`   Seeded ${gameGenres.length} game genres`);
  }
  
  return { gameGenres, error };
}

async function seedMovies(batchSize = 100) {
  console.log('\nSeeding movies...');
  
  const file = path.join(TRANSFORMED_DIR, 'movies.json');
  if (!fs.existsSync(file)) {
    console.error('movies.json not found. Run transform-movies.js first!');
    return;
  }
  
  const movies = JSON.parse(fs.readFileSync(file, 'utf-8'));
  console.log(`   Total movies to seed: ${movies.length}`);
  
  let inserted = 0;
  let errors = 0;
  
  // Insert in batches
  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize);
    const { error } = await supabase
      .from('movies')
      .upsert(batch, { onConflict: 'title,year', ignoreDuplicates: true });
    
    if (error) {
      console.error(` Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
      errors++;
    } else {
      inserted += batch.length;
      console.log(`  Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(movies.length/batchSize)}`);
    }
  }
  
  console.log(`  Movies seeded: ${inserted}/${movies.length} (${errors} batch errors)`);
  return { inserted, errors };
}

async function seedGames(batchSize = 100) {
  console.log('\nSeeding games...');
  
  const file = path.join(TRANSFORMED_DIR, 'games.json');
  if (!fs.existsSync(file)) {
    console.error('games.json not found. Run transform-games.js first!');
    return;
  }
  
  const games = JSON.parse(fs.readFileSync(file, 'utf-8'));
  console.log(`   Total games to seed: ${games.length}`);
  
  let inserted = 0;
  let errors = 0;
  
  // Insert in batches
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    const { error } = await supabase
      .from('games')
      .upsert(batch, { onConflict: 'rawg_id', ignoreDuplicates: true });
    
    if (error) {
      console.error(` Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
      errors++;
    } else {
      inserted += batch.length;
      console.log(`  Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(games.length/batchSize)}`);
    }
  }
  
  console.log(`  Games seeded: ${inserted}/${games.length} (${errors} batch errors)`);
  return { inserted, errors };
}

async function createTestUsers() {
  console.log('\nCreating test users...');
  console.log('   Note: Use real email to verify registration, or disable email auth in Supabase');
  
  for (const user of TEST_USERS) {
    try {
      // Try to sign up - will fail if email already exists
      // For testing, you might want to disable "Confirm email" in Supabase
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          console.log(` User ${user.email} already exists (skipping)`);
        } else {
          console.error(` ${user.email}: ${error.message}`);
        }
      } else {
        console.log(` Created user: ${user.email}`);
      }
    } catch (err) {
      console.error(` Exception for ${user.email}:`, err.message);
    }
  }
  
  console.log('\n  Test credentials (use these after email verification):');
  TEST_USERS.forEach(u => console.log(`      ${u.email} / ${u.password}`));
}

async function verifyData() {
  console.log('\nVerifying data...');
  
  const tables = ['genres', 'game_genres', 'movies', 'games'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(` ${table}:`, error.message);
    } else {
      console.log(` ${table}: ${count || 0} rows`);
    }
  }
}

async function main() {
  console.log('Starting Supabase Seed');
  console.log(`   URL: ${supabaseUrl}`);
  console.log('\nIMPORTANT: If seeding fails, run these SQL commands first:');
  console.log('   1. data-pipeline/supabase-schema-v2.sql (if fresh database)');
  console.log('   2. data-pipeline/supabase-seed-fix.sql (to enable INSERT)');
  
  // Seed in order (dependencies)
  await seedGenres();
  await seedGameGenres();
  await seedMovies();
  await seedGames();
  
  // Create test users
  await createTestUsers();
  
  // Verify
  await verifyData();
  
  console.log('Seed complete!');
}

// Run
main().catch(console.error);
