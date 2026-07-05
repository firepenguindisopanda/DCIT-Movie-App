const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_KEY = 'a6cb5debb5624c94b7828c86caa1c6f9';
const BASE_URL = 'https://api.rawg.io/api/games';
const OUTPUT_DIR = path.join(__dirname, '../data/raw');
const PAGE_SIZE = 40;

const GENRES = [
  { id: 4, name: 'Action' },
  { id: 51, name: 'Indie' },
  { id: 3, name: 'Adventure' },
  { id: 5, name: 'RPG' },
  { id: 10, name: 'Strategy' },
  { id: 2, name: 'Shooter' },
  { id: 40, name: 'Casual' },
  { id: 14, name: 'Simulation' },
  { id: 7, name: 'Puzzle' },
  { id: 11, name: 'Arcade' },
  { id: 83, name: 'Platformer' },
  { id: 59, name: 'MMO' },
  { id: 1, name: 'Racing' },
  { id: 15, name: 'Sports' },
  { id: 6, name: 'Fighting' },
];

const PLATFORMS = [
  { id: 4, name: 'PC' },
  { id: 18, name: 'PS4' },
  { id: 187, name: 'PS5' },
  { id: 1, name: 'Xbox One' },
  { id: 186, name: 'Xbox Series' },
  { id: 7, name: 'Nintendo Switch' },
  { id: 3, name: 'iOS' },
  { id: 21, name: 'Android' },
];

const CATEGORIES = [
  ...GENRES.map(g => ({ name: `Genre: ${g.name}`, params: { genres: String(g.id), ordering: '-rating' }, pages: 3 })),
  ...PLATFORMS.map(p => ({ name: `Platform: ${p.name}`, params: { platforms: String(p.id), ordering: '-added' }, pages: 2 })),
  { name: '80s', params: { dates: '1980-01-01,1989-12-31', ordering: '-rating' }, pages: 3 },
  { name: '90s', params: { dates: '1990-01-01,1999-12-31', ordering: '-rating' }, pages: 3 },
  { name: '2000s', params: { dates: '2000-01-01,2009-12-31', ordering: '-rating' }, pages: 3 },
  { name: '2010s', params: { dates: '2010-01-01,2019-12-31', ordering: '-rating' }, pages: 3 },
  { name: '2020s', params: { dates: '2020-01-01,2029-12-31', ordering: '-rating' }, pages: 3 },
  { name: 'Best Rated', params: { metacritic: '80,100', ordering: '-metacritic' }, pages: 5 },
  { name: 'Most Added', params: { ordering: '-added' }, pages: 5 },
  { name: 'Recently Released', params: { ordering: '-released' }, pages: 3 },
];

async function fetchWithRetry(url, retries = 3, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error(`  Attempt ${i + 1} failed:`, error.message);
      if (error.response?.status === 429) {
        console.log('  Rate limited, waiting 10s...');
        await new Promise(r => setTimeout(r, 10000));
      } else if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  return null;
}

async function fetchCategoryPages(name, baseParams, pageCount) {
  console.log(`\n  [${name}] Fetching ${pageCount} pages...`);
  const games = [];
  for (let page = 1; page <= pageCount; page++) {
    const params = new URLSearchParams({
      key: API_KEY,
      page_size: String(PAGE_SIZE),
      page: String(page),
      ...Object.fromEntries(Object.entries(baseParams).map(([k, v]) => [k, String(v)]))
    }).toString();

    const data = await fetchWithRetry(`${BASE_URL}?${params}`);
    if (data?.results) {
      games.push(...data.results);
      console.log(`    Page ${page}/${pageCount} — ${data.results.length} games`);
    } else {
      console.log(`    Page ${page}/${pageCount} — failed or empty`);
    }
    if (page < pageCount) await new Promise(r => setTimeout(r, 600));
  }
  return games;
}

async function main() {
  console.log('=== RAWG Comprehensive Games Fetcher ===\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const seenIds = new Set();
  const allGames = [];

  for (const cat of CATEGORIES) {
    const games = await fetchCategoryPages(cat.name, cat.params, cat.pages);
    const newGames = games.filter(g => {
      if (seenIds.has(g.id)) return false;
      seenIds.add(g.id);
      return true;
    });
    allGames.push(...newGames);
    console.log(`    → ${newGames.length} new (${seenIds.size} unique total)`);
  }

  console.log(`\n  Total unique games: ${allGames.length}`);

  // Save combined raw data
  const rawOutput = path.join(OUTPUT_DIR, 'games-all-raw.json');
  fs.writeFileSync(rawOutput, JSON.stringify(allGames, null, 2));

  // Summary
  const withMetacritic = allGames.filter(g => g.metacritic).length;
  const withRating = allGames.filter(g => g.rating > 0).length;
  const withImage = allGames.filter(g => g.background_image).length;
  const platforms = new Set();
  allGames.forEach(g => g.platforms?.forEach(p => platforms.add(p.platform?.name)));
  const genres = new Set();
  allGames.forEach(g => g.genres?.forEach(ge => genres.add(ge.name)));

  console.log(`\n  === Summary ===`);
  console.log(`  Total: ${allGames.length}`);
  console.log(`  With metacritic: ${withMetacritic}`);
  console.log(`  With rating: ${withRating}`);
  console.log(`  With image: ${withImage}`);
  console.log(`  Unique platforms: ${platforms.size}`);
  console.log(`  Unique genres: ${genres.size}`);
  console.log(`\n  Saved to: ${rawOutput}`);
  console.log(`\nDone!`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { main, CATEGORIES, GENRES, PLATFORMS };
