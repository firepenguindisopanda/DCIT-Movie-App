require('dotenv').config();
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '../src/environments/environment.prod.ts');
let content = fs.readFileSync(envFile, 'utf8');

const replacements = {
  'YOUR_RAWG_API_KEY': process.env.RAWG_API_KEY || '',
  'YOUR_SUPABASE_URL': process.env.SUPABASE_URL || '',
  'YOUR_SUPABASE_KEY': process.env.SUPABASE_KEY || '',
  // TMDB configuration (key is the only secret; base URLs are constant)
  'YOUR_TMDB_API_KEY': process.env.TMDB_API_KEY || ''
};

let modified = false;
for (const [placeholder, value] of Object.entries(replacements)) {
  if (value) {
    content = content.replace(`'${placeholder}'`, `'${value}'`);
    modified = true;
  }
}

if (modified) {
  fs.writeFileSync(envFile, content);
  console.log('Environment variables injected successfully');
} else {
  console.log('No environment variables found, using placeholder values');
}
