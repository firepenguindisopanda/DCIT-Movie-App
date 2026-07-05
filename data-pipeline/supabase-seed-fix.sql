ALTER TABLE movies ADD CONSTRAINT movies_title_year_key UNIQUE (title, year);

-- Games: unique on rawg_id (already has UNIQUE constraint in schema)

-- Drop existing SELECT policies and recreate with INSERT
DROP POLICY IF EXISTS "Anyone can view movies" ON movies;
CREATE POLICY "Anyone can view movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert movies" ON movies FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view games" ON games;
CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Anyone can insert games" ON games FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view genres" ON genres;
CREATE POLICY "Anyone can view genres" ON genres FOR SELECT USING (true);
CREATE POLICY "Anyone can insert genres" ON genres FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view game_genres" ON game_genres;
CREATE POLICY "Anyone can view game_genres" ON game_genres FOR SELECT USING (true);
CREATE POLICY "Anyone can insert game_genres" ON game_genres FOR INSERT WITH CHECK (true);

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
