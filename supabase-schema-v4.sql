-- =============================================================================
-- v4: Watch Sessions (group voting)
--
-- Adds the "what are we watching/playing tonight?" feature: a host creates a
-- session, adds candidates from either catalog, shares a code, and everyone
-- votes. Runs alongside v3 -- it does not drop or alter any existing table.
--
-- media_id convention matches the existing favorites/comments tables:
--   media_type = 'movie' -> media_id is movies.tmdb_id
--   media_type = 'game'  -> media_id is games.id
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- Sessions -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watch_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(8) UNIQUE NOT NULL,              -- short share code, e.g. 'K3F9QP'
  title VARCHAR(120) NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  host_email VARCHAR(255),
  status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closes_at TIMESTAMP WITH TIME ZONE,           -- optional soft deadline
  winner_candidate_id UUID,                     -- set when the host closes voting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --- Candidates ---------------------------------------------------------------
-- title/image are denormalized so the session page renders without N lookups
-- across two different catalog tables.
CREATE TABLE IF NOT EXISTS session_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES watch_sessions(id) ON DELETE CASCADE NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'game')),
  media_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  image_url TEXT,
  year INTEGER,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (session_id, media_type, media_id)     -- no duplicate candidates
);

ALTER TABLE watch_sessions
  DROP CONSTRAINT IF EXISTS watch_sessions_winner_fkey;
ALTER TABLE watch_sessions
  ADD CONSTRAINT watch_sessions_winner_fkey
  FOREIGN KEY (winner_candidate_id) REFERENCES session_candidates(id) ON DELETE SET NULL;

-- --- Votes --------------------------------------------------------------------
-- One vote per user per session. Changing your mind is an UPDATE, not a second row.
CREATE TABLE IF NOT EXISTS session_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES watch_sessions(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES session_candidates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

-- --- Indexes ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_watch_sessions_code ON watch_sessions(code);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_host ON watch_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_created ON watch_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_candidates_session ON session_candidates(session_id);
CREATE INDEX IF NOT EXISTS idx_session_votes_session ON session_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_votes_candidate ON session_votes(candidate_id);

-- --- Row Level Security -------------------------------------------------------
ALTER TABLE watch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_votes ENABLE ROW LEVEL SECURITY;

-- Sessions are readable by anyone holding the code. SELECT is open (same posture
-- as the existing comments table) because the share link has to resolve before
-- we know who the viewer is. The code is the capability -- treat it as unlisted,
-- not secret.
DROP POLICY IF EXISTS "Anyone can view sessions" ON watch_sessions;
CREATE POLICY "Anyone can view sessions" ON watch_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create sessions" ON watch_sessions;
CREATE POLICY "Authenticated users can create sessions" ON watch_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their sessions" ON watch_sessions;
CREATE POLICY "Hosts can update their sessions" ON watch_sessions
  FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete their sessions" ON watch_sessions;
CREATE POLICY "Hosts can delete their sessions" ON watch_sessions
  FOR DELETE USING (auth.uid() = host_id);

-- Candidates: anyone can see them; any signed-in user can suggest one; you can
-- withdraw your own suggestion, and the host can remove any.
DROP POLICY IF EXISTS "Anyone can view candidates" ON session_candidates;
CREATE POLICY "Anyone can view candidates" ON session_candidates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can add candidates" ON session_candidates;
CREATE POLICY "Authenticated users can add candidates" ON session_candidates
  FOR INSERT WITH CHECK (
    auth.uid() = added_by
    AND EXISTS (
      SELECT 1 FROM watch_sessions s
      WHERE s.id = session_id AND s.status = 'open'
    )
  );

DROP POLICY IF EXISTS "Adder or host can remove candidates" ON session_candidates;
CREATE POLICY "Adder or host can remove candidates" ON session_candidates
  FOR DELETE USING (
    auth.uid() = added_by
    OR EXISTS (
      SELECT 1 FROM watch_sessions s
      WHERE s.id = session_id AND s.host_id = auth.uid()
    )
  );

-- Votes: the tally is public, but you may only cast/change/withdraw your own,
-- and only while the session is open.
DROP POLICY IF EXISTS "Anyone can view votes" ON session_votes;
CREATE POLICY "Anyone can view votes" ON session_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can cast their own vote" ON session_votes;
CREATE POLICY "Users can cast their own vote" ON session_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM watch_sessions s
      WHERE s.id = session_id AND s.status = 'open'
    )
  );

DROP POLICY IF EXISTS "Users can change their own vote" ON session_votes;
CREATE POLICY "Users can change their own vote" ON session_votes
  FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM watch_sessions s
      WHERE s.id = session_id AND s.status = 'open'
    )
  );

DROP POLICY IF EXISTS "Users can withdraw their own vote" ON session_votes;
CREATE POLICY "Users can withdraw their own vote" ON session_votes
  FOR DELETE USING (auth.uid() = user_id);

-- --- Realtime -----------------------------------------------------------------
-- Live tallies: the app subscribes to vote and candidate changes per session.
-- Guarded so the whole script stays re-runnable; ADD TABLE errors if the table
-- is already a member of the publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'session_votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE session_votes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'session_candidates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE session_candidates;
  END IF;
END $$;
