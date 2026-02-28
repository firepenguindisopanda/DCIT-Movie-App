-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Genres table (for movies)
CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game genres reference (from RAWG)
CREATE TABLE IF NOT EXISTS game_genres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  year INTEGER,
  poster_url TEXT,
  imdb_rating DECIMAL(3,1),
  rt_score INTEGER,
  worldwide_gross VARCHAR(50),
  studio VARCHAR(100),
  rating VARCHAR(10),
  length INTEGER,
  genres TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT movies_title_year_key UNIQUE (title, year)  -- Added for upsert
);

-- Games table (for RAWG data)
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

-- Favorites table (requires auth)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'game')),
  media_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, media_type, media_id)
);

-- Comments table (requires auth)
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

-- Movies/Games indexes for genre filtering
CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_games_genres ON games USING GIN(genres);

-- Enable RLS on all tables
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_genres ENABLE ROW LEVEL SECURITY;

-- Movies: Public read + insert (needed for seeding)
CREATE POLICY "Anyone can view movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert movies" ON movies FOR INSERT WITH CHECK (true);

-- Games: Public read + insert
CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Anyone can insert games" ON games FOR INSERT WITH CHECK (true);

-- Genres: Public read + insert
CREATE POLICY "Anyone can view genres" ON genres FOR SELECT USING (true);
CREATE POLICY "Anyone can insert genres" ON genres FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view game_genres" ON game_genres FOR SELECT USING (true);
CREATE POLICY "Anyone can insert game_genres" ON game_genres FOR INSERT WITH CHECK (true);

-- Favorites policies
CREATE POLICY "Users can view own favorites" 
  ON favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" 
  ON favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" 
  ON favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" 
  ON comments FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert comments" 
  ON comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
  ON comments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
  ON comments FOR DELETE 
  USING (auth.uid() = user_id);
