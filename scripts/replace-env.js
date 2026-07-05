require('dotenv').config();
const fs = require('fs');
const path = require('path');

const envFiles = [
  path.join(__dirname, '../src/environments/environment.ts'),
  path.join(__dirname, '../src/environments/environment.prod.ts')
];

const replacements = {
  'YOUR_RAWG_API_KEY': process.env.RAWG_API_KEY || '',
  'YOUR_SUPABASE_URL': process.env.SUPABASE_URL || '',
  'YOUR_SUPABASE_KEY': process.env.SUPABASE_KEY || '',
  'YOUR_TMDB_API_KEY': process.env.TMDB_API_KEY || ''
};

let anyModified = false;

for (const envFile of envFiles) {
  let content = fs.readFileSync(envFile, 'utf8');
  let modified = false;

  for (const [placeholder, value] of Object.entries(replacements)) {
    if (value) {
      content = content.replace(`'${placeholder}'`, `'${value}'`);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(envFile, content);
    console.log(`Injected env vars into ${path.basename(envFile)}`);
    anyModified = true;
  }
}

if (!anyModified) {
  console.log('No environment variables found, using placeholder values');
}
