/**
 * Fetch Games Script
 * Fetches games from RAWG API and saves to JSON
 * 
 * Data Source: https://api.rawg.io/api/games
 * 
 * Usage: node scripts/fetch-games.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

require('dotenv').config();
const API_KEY = process.env.RAWG_API_KEY;
if (!API_KEY) {
  console.error('RAWG_API_KEY is required. Set it in data-pipeline/.env');
  process.exit(1);
}
const BASE_URL = 'https://api.rawg.io/api/games';
const OUTPUT_DIR = path.join(__dirname, '../data/raw');
const PAGE_SIZE = 40;
const TOTAL_PAGES = 10; // 400 games

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

async function fetchAllGames() {
  console.log('Fetching games from RAWG API...');
  
  // Ensure directory exists
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allGames = [];
  let totalCount = 0;

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    console.log(`  Fetching page ${page}/${TOTAL_PAGES}...`);
    
    const url = `${BASE_URL}?key=${API_KEY}&page_size=${PAGE_SIZE}&page=${page}`;
    const data = await fetchWithRetry(url);
    
    if (data.results && data.results.length > 0) {
      allGames.push(...data.results);
      totalCount += data.results.length;
      
      // Save each page
      const pageFile = path.join(OUTPUT_DIR, `games-page-${page}.json`);
      fs.writeFileSync(pageFile, JSON.stringify(data.results, null, 2));
    }
    
    // Rate limiting - be nice to the API
    await new Promise(r => setTimeout(r, 500));
  }

  // Save combined raw data
  const rawOutput = path.join(OUTPUT_DIR, 'games-all-raw.json');
  fs.writeFileSync(rawOutput, JSON.stringify(allGames, null, 2));

  console.log(`\nSummary:`);
  console.log(`   Total games fetched: ${allGames.length}`);
  console.log(`\nFiles saved to: ${OUTPUT_DIR}`);
  
  return allGames;
}

// Run if called directly
if (require.main === module) {
  fetchAllGames()
    .then(() => {
      console.log('\nGames fetch complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nError:', error.message);
      process.exit(1);
    });
}

module.exports = { fetchAllGames };
