# Data Pipeline - DCIT Movie App

This data pipeline fetches movies and games from external APIs, transforms them to match our database schema, and seeds them into Supabase.

## Data Sources

### Movies API
- **Source**: https://weblabs.web.app/api/movies/
- **Index**: https://weblabs.web.app/api/movies/index.json
- **Genres**: 20 genres (Action, Adventure, Comedy, Drama, etc.)
- **Fields**: title, year, poster_url, imdb_rating, rt_score, worldwide_gross, studio, rating, length, genres

### Games API (RAWG)
- **Source**: https://api.rawg.io/api/games
- **API Key**: `a6cb5debb5624c94b7828c86caa1c6f9`
- **Pages**: 10 pages × 40 games = 400 games
- **Fields**: rawg_id, slug, name, released, background_image, rating, metacritic, genres, platforms

## Quick Start

### 1. Setup

```bash
cd data-pipeline
npm install
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your Supabase credentials
# Get them from: Supabase Dashboard > Settings > API
```

### 3. Run Full Pipeline

```bash
# Option A: Run all steps manually
npm run fetch:movies
npm run fetch:games
npm run transform:movies
npm run transform:games
npm run seed:all

# Option B: Run full pipeline at once
npm run pipeline
npm run seed:all
```

### 4. Run Individual Steps

```bash
# Fetch data (from APIs)
npm run fetch:movies
npm run fetch:games

# Transform data (to schema)
npm run transform:movies
npm run transform:games

# Seed to Supabase
npm run seed:all
```

## Data Format

### Movies (transformed)
```json
{
  "title": "Captain America: The Winter Soldier",
  "year": 2014,
  "poster_url": "http://resizing.flixster.com/...",
  "imdb_rating": 7.8,
  "rt_score": 75,
  "worldwide_gross": "$714,766,572.00",
  "studio": "Marvel Studios",
  "rating": "PG-13",
  "length": 136,
  "genres": ["Sci-Fi", "Adventure", "Action"]
}
```

### Games (transformed)
```json
{
  "rawg_id": 3498,
  "slug": "grand-theft-auto-v",
  "name": "Grand Theft Auto V",
  "released": "2013-09-17",
  "background_image": "https://media.rawg.io/...",
  "rating": 4.47,
  "metacritic": 92,
  "genres": ["Action", "Adventure"],
  "platforms": ["PC", "PlayStation", "Xbox"]
}
```

## Test Users

After seeding, these test users will be created:

| Email | Password |
|-------|----------|
| testuser1@example.com | TestPassword123! |
| testuser2@example.com | TestPassword123! |
| demo@example.com | DemoPassword123! |

## Troubleshooting

### Rate Limiting
- The scripts include delays to avoid hitting API rate limits
- If you get rate limited, increase the delay in the fetch scripts

### Supabase Errors
- Make sure your Supabase URL and anon key are correct
- Check that tables exist in your Supabase project
- Ensure RLS policies don't block inserts

### Missing Data
- Check `data/raw/` for the raw API responses
- Check `data/transformed/` for the transformed data
- Review console output for error messages

## Supabase Tables

The seed script will populate these tables:

| Table | Description | Rows (est) |
|-------|-------------|------------|
| genres | Movie genres | ~20 |
| game_genres | Game genres | ~10 |
| movies | All movies | ~900 |
| games | All games | ~400 |

Auth users are created separately via Supabase Auth.

## Notes

- Raw data is preserved in `data/raw/` for debugging
- Transformed data in `data/transformed/` is ready for re-seeding
- The pipeline is idempotent - running multiple times is safe
