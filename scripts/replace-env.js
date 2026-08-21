// Generates src/environments/environment{,.prod}.ts from environment.example.ts
// and injects secrets from the environment (or a local .env).
//
// Both generated files are gitignored, so they do NOT exist on a fresh clone or
// in CI. This script creates them from the checked-in example rather than
// assuming they are already there.

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const ENV_DIR = path.join(__dirname, '../src/environments');
const EXAMPLE = path.join(ENV_DIR, 'environment.example.ts');

const targets = [
  { file: path.join(ENV_DIR, 'environment.ts'), production: false },
  { file: path.join(ENV_DIR, 'environment.prod.ts'), production: true }
];

const replacements = {
  YOUR_RAWG_API_KEY: process.env.RAWG_API_KEY,
  YOUR_SUPABASE_URL: process.env.SUPABASE_URL,
  YOUR_SUPABASE_KEY: process.env.SUPABASE_KEY,
  YOUR_TMDB_API_KEY: process.env.TMDB_API_KEY
};

if (!fs.existsSync(EXAMPLE)) {
  console.error(`Missing ${path.relative(process.cwd(), EXAMPLE)} - cannot generate environment files.`);
  process.exit(1);
}

const template = fs.readFileSync(EXAMPLE, 'utf8');
const supplied = Object.entries(replacements).filter(([, v]) => v);
const missing = Object.entries(replacements).filter(([, v]) => !v).map(([k]) => k);

for (const { file, production } of targets) {
  const created = !fs.existsSync(file);

  // Seed from the example when absent; otherwise keep whatever is already there
  // so a developer's hand-edited local file is never clobbered.
  let content = created
    ? template.replace('production: false', `production: ${production}`)
    : fs.readFileSync(file, 'utf8');

  for (const [placeholder, value] of supplied) {
    content = content.split(`'${placeholder}'`).join(`'${value}'`);
  }

  fs.writeFileSync(file, content);
  console.log(`${created ? 'Created' : 'Updated'} ${path.basename(file)}`);
}

if (supplied.length === 0) {
  console.warn('No API keys found in the environment - building with placeholder values.');
  console.warn('The app will compile, but API calls will fail at runtime.');
} else if (missing.length > 0) {
  console.warn(`Injected ${supplied.length} key(s); still using placeholders for: ${missing.join(', ')}`);
} else {
  console.log(`Injected all ${supplied.length} keys.`);
}
