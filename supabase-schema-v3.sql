-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS movie_genres CASCADE;

CREATE TABLE IF NOT EXISTS movie_genres (
  id INTEGER PRIMARY KEY,  -- TMDB genre ID
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS movies CASCADE;

CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER UNIQUE,  -- TMDB movie ID for lookups
  
  -- Titles
  title VARCHAR(255) NOT NULL,
  original_title VARCHAR(255),
  tagline TEXT,
  
  -- Dates
  release_date DATE,
  year INTEGER,
  
  -- Images
  poster_url TEXT,
  backdrop_url TEXT,
  
  -- Description
  overview TEXT,
  
  -- Ratings & Popularity
  vote_average DECIMAL(3,1),
  vote_count INTEGER,
  popularity DECIMAL(10,2),
  
  -- Metadata
  adult BOOLEAN DEFAULT false,
  original_language VARCHAR(10),
  status VARCHAR(20),
  
  -- Genres (array of genre names)
  genres TEXT[] DEFAULT '{}',
  
  -- Additional Details
  runtime INTEGER,  -- in minutes
  budget BIGINT,
  revenue BIGINT,
  
  -- Production (JSON)
  production_companies JSONB DEFAULT '[]',
  spoken_languages JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_genres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  rawg_id INTEGER UNIQUE,
  slug VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  released DATE,
  background_image TEXT,
  rating DECIMAL(3,2),
  metacritic INTEGER,
  genres TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS favorites CASCADE;

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'game')),
  media_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, media_type, media_id)
);

DROP TABLE IF EXISTS comments CASCADE;

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'game')),
  media_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_media ON favorites(user_id, media_type, media_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_media ON comments(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- Movies indexes
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_movies_vote_average ON movies(vote_average DESC);
CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity DESC);

-- Games indexes (unchanged)
CREATE INDEX IF NOT EXISTS idx_games_rawg_id ON games(rawg_id);
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
CREATE INDEX IF NOT EXISTS idx_games_genres ON games USING GIN(genres);

-- Movie genres indexes
CREATE INDEX IF NOT EXISTS idx_movie_genres_name ON movie_genres(name);


-- Enable RLS on favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Movies and genres are public (read-only for this app)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Public can view movie genres" ON movie_genres FOR SELECT USING (true);
CREATE POLICY "Public can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Public can view game genres" ON game_genres FOR SELECT USING (true);

-- =============================================================================
-- SEED DATA LOCATION
-- =============================================================================
-- Movies data: data/transformed/movies.json
-- Movie genres data: data/transformed/movie_genres.json
-- Games data: existing (from RAWG pipeline)
-- Game genres data: existing (from RAWG pipeline)
--
-- To seed, use: node scripts/seed-tmdb-supabase.js
-- =============================================================================
