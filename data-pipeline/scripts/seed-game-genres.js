/**
 * Seed Game Genres Only
 * Seeds game_genres table without affecting other data
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TRANSFORMED_DIR = path.join(__dirname, '../data/transformed');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedGameGenres() {
  console.log('Seeding game genres...');
  
  const file = path.join(TRANSFORMED_DIR, 'game-genres.json');
  if (!fs.existsSync(file)) {
    console.error('game-genres.json not found!');
    return;
  }
  
  const gameGenres = JSON.parse(fs.readFileSync(file, 'utf-8'));
  console.log(`   Game genres to seed: ${gameGenres.length}`);
  console.log(`   ${JSON.stringify(gameGenres)}`);
  
  const { data, error } = await supabase
    .from('game_genres')
    .upsert(gameGenres, { onConflict: 'name', ignoreDuplicates: true })
    .select();
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`  Seeded ${gameGenres.length} game genres`);
  }

  // Verify
  const { count } = await supabase
    .from('game_genres')
    .select('*', { count: 'exact', head: true });
  console.log(`  Total in database: ${count}`);
}

seedGameGenres()
  .then(() => console.log('\n✅ Done!'))
  .catch(console.error);
