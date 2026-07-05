/**
 * Transform Games Script
 * Transforms raw RAWG game data to Supabase schema format
 * 
 * Usage: node scripts/transform-games.js
 */

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '../data/raw');
const TRANSFORMED_DIR = path.join(__dirname, '../data/transformed');

function extractPlatforms(platforms) {
  if (!platforms || !Array.isArray(platforms)) return [];
  return platforms
    .map(p => p.platform?.name)
    .filter(n => n);
}

function extractGenres(genres) {
  if (!genres || !Array.isArray(genres)) return [];
  return genres.map(g => g.name);
}

function transformGame(game) {
  return {
    rawg_id: game.id,
    slug: game.slug || null,
    name: game.name || null,
    released: game.released || null,
    background_image: game.background_image || null,
    rating: game.rating ? parseFloat(game.rating) : null,
    metacritic: game.metacritic || null,
    genres: extractGenres(game.genres),
    platforms: extractPlatforms(game.platforms)
  };
}

function transformGames() {
  console.log('Transforming games...');
  
  // Ensure output directory exists
  if (!fs.existsSync(TRANSFORMED_DIR)) {
    fs.mkdirSync(TRANSFORMED_DIR, { recursive: true });
  }

  // Read raw data
  const rawFile = path.join(RAW_DIR, 'games-all-raw.json');
  if (!fs.existsSync(rawFile)) {
    console.error('Raw games data not found. Run fetch-games.js first!');
    process.exit(1);
  }
  
  const rawGames = JSON.parse(fs.readFileSync(rawFile, 'utf-8'));
  console.log(` Raw games: ${rawGames.length}`);

  // Transform each game
  const transformedGames = rawGames.map(transformGame);

  // Deduplicate by rawg_id
  const uniqueGames = [];
  const seen = new Set();
  
  for (const game of transformedGames) {
    if (!game.rawg_id) continue;
    if (!seen.has(game.rawg_id)) {
      seen.add(game.rawg_id);
      uniqueGames.push(game);
    }
  }

  // Extract all unique game genres
  const allGameGenres = new Set();
  uniqueGames.forEach(game => {
    if (game.genres) {
      game.genres.forEach(g => allGameGenres.add(g));
    }
  });
  const gameGenresArray = Array.from(allGameGenres).sort().map(name => ({ name }));

  // Save transformed data
  const gamesOutput = path.join(TRANSFORMED_DIR, 'games.json');
  fs.writeFileSync(gamesOutput, JSON.stringify(uniqueGames, null, 2));

  const gameGenresOutput = path.join(TRANSFORMED_DIR, 'game-genres.json');
  fs.writeFileSync(gameGenresOutput, JSON.stringify(gameGenresArray, null, 2));

  console.log(`\nTransformation Summary:`);
  console.log(`  Total games: ${uniqueGames.length}`);
  console.log(`  Unique game genres: ${gameGenresArray.length}`);
  console.log(`\nOutput files:`);
  console.log(`  - ${gamesOutput}`);
  console.log(`  - ${gameGenresOutput}`);

  return { games: uniqueGames, gameGenres: gameGenresArray };
}

// Run if called directly
if (require.main === module) {
  transformGames();
  console.log('\nGames transformation complete!');
}

module.exports = { transformGames };
