-- Alliance Notes table
CREATE TABLE IF NOT EXISTS alliance_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  subject_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  trust_level TEXT NOT NULL CHECK (trust_level IN ('distrust', 'neutral', 'ally', 'core')),
  tags TEXT[] DEFAULT '{}',
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alliance_notes_author_idx ON alliance_notes(author_id);
CREATE INDEX IF NOT EXISTS alliance_notes_season_idx ON alliance_notes(season_id);

-- Jury Questions table
CREATE TABLE IF NOT EXISTS jury_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  juror_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  finalist_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS jury_questions_season_idx ON jury_questions(season_id);
CREATE INDEX IF NOT EXISTS jury_questions_finalist_idx ON jury_questions(finalist_id);

-- RLS Policies for alliance_notes
ALTER TABLE alliance_notes ENABLE ROW LEVEL SECURITY;

-- Authors can read their own notes
CREATE POLICY "Authors can read their own alliance notes"
  ON alliance_notes FOR SELECT
  USING (
    author_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- Authors can insert their own notes
CREATE POLICY "Authors can create alliance notes"
  ON alliance_notes FOR INSERT
  WITH CHECK (
    author_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- Authors can update their own notes
CREATE POLICY "Authors can update their own alliance notes"
  ON alliance_notes FOR UPDATE
  USING (
    author_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- Authors can delete their own notes
CREATE POLICY "Authors can delete their own alliance notes"
  ON alliance_notes FOR DELETE
  USING (
    author_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for jury_questions
ALTER TABLE jury_questions ENABLE ROW LEVEL SECURITY;

-- Jurors and finalists can read questions addressed to/from them
CREATE POLICY "Jury members and finalists can read relevant questions"
  ON jury_questions FOR SELECT
  USING (
    juror_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR finalist_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Jurors can ask questions
CREATE POLICY "Jurors can create questions"
  ON jury_questions FOR INSERT
  WITH CHECK (
    juror_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- Finalists can answer their questions
CREATE POLICY "Finalists can update answers"
  ON jury_questions FOR UPDATE
  USING (
    finalist_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- DB function for player stats (used by /api/stats/player)
CREATE OR REPLACE FUNCTION get_player_stats(p_player_id UUID, p_season_id UUID)
RETURNS TABLE (
  challenge_wins INT,
  tribals_survived INT,
  votes_received INT,
  advantages_found INT,
  alliance_count INT,
  confessional_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT COUNT(*) FROM challenge_results WHERE subject_id = p_player_id AND subject_type = 'player'), 0)::INT,
    COALESCE((SELECT COUNT(DISTINCT day) FROM votes WHERE season_id = p_season_id AND day <= (SELECT MAX(day) FROM votes WHERE voter_player_id = p_player_id)), 0)::INT,
    COALESCE((SELECT COUNT(*) FROM votes WHERE target_player_id = p_player_id AND season_id = p_season_id), 0)::INT,
    COALESCE((SELECT COUNT(*) FROM items WHERE owner_player_id = p_player_id AND season_id = p_season_id), 0)::INT,
    COALESCE((SELECT COUNT(DISTINCT alliance_id) FROM alliance_members WHERE player_id = p_player_id), 0)::INT,
    COALESCE((SELECT COUNT(*) FROM confessionals WHERE player_id = p_player_id), 0)::INT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_player_stats(UUID, UUID) TO authenticated;
