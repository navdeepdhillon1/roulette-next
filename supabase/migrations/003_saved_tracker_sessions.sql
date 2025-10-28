-- Saved Advanced Tracker Sessions
-- Allows users to save and load complete tracker sessions with all spins and metadata

CREATE TABLE IF NOT EXISTS saved_tracker_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session Metadata
  session_name TEXT NOT NULL,
  session_description TEXT,

  -- Original Session Data
  original_session_id TEXT NOT NULL,
  session_data JSONB NOT NULL,
  -- Stores: {
  --   balance: number,
  --   starting_balance: number,
  --   total_profit_loss: number,
  --   total_spins: number,
  --   total_bets: number,
  --   winning_bets: number,
  --   losing_bets: number,
  --   created_at: string,
  --   updated_at: string
  -- }

  -- Spins Data (array of all spins from session)
  spins_data JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Player Setup Configuration
  player_setup JSONB,
  -- Stores: {
  --   bankroll: number,
  --   targetProfit: number,
  --   stopLoss: number,
  --   timeAvailable: number,
  --   betUnit: number,
  --   progressionStyle: string,
  --   playerLevel: string
  -- }

  -- Bet History
  bet_history JSONB DEFAULT '[]'::jsonb,

  -- Quick Stats for Display
  final_bankroll DECIMAL(10,2),
  final_pnl DECIMAL(10,2),
  total_spins_count INTEGER,
  session_duration_minutes INTEGER,

  -- Tags for Organization
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  favorite BOOLEAN DEFAULT false,

  -- Timestamps
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_loaded_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_saved_tracker_sessions_user ON saved_tracker_sessions(user_id);
CREATE INDEX idx_saved_tracker_sessions_name ON saved_tracker_sessions(session_name);
CREATE INDEX idx_saved_tracker_sessions_saved_at ON saved_tracker_sessions(saved_at DESC);
CREATE INDEX idx_saved_tracker_sessions_favorite ON saved_tracker_sessions(user_id, favorite) WHERE favorite = true;
CREATE INDEX idx_saved_tracker_sessions_tags ON saved_tracker_sessions USING GIN(tags);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE saved_tracker_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved sessions" ON saved_tracker_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved sessions" ON saved_tracker_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved sessions" ON saved_tracker_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved sessions" ON saved_tracker_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE TRIGGER update_saved_tracker_sessions_updated_at
  BEFORE UPDATE ON saved_tracker_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION TO ENFORCE SESSION LIMIT PER USER (10 for basic, 50 for premium)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_saved_sessions_limit()
RETURNS TRIGGER AS $$
DECLARE
  session_count INTEGER;
  user_is_premium BOOLEAN;
  max_sessions INTEGER;
BEGIN
  -- Count existing sessions for this user
  SELECT COUNT(*) INTO session_count
  FROM saved_tracker_sessions
  WHERE user_id = NEW.user_id;

  -- TODO: Check if user is premium (for now, everyone is basic tier)
  -- In production, you'd check a user_profiles or subscriptions table
  user_is_premium := false;

  -- Set limit based on tier
  IF user_is_premium THEN
    max_sessions := 50;
  ELSE
    max_sessions := 10;
  END IF;

  -- Check limit
  IF session_count >= max_sessions THEN
    RAISE EXCEPTION 'Session limit reached. Maximum % saved sessions allowed for your tier.', max_sessions;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_saved_sessions_limit
  BEFORE INSERT ON saved_tracker_sessions
  FOR EACH ROW
  EXECUTE FUNCTION check_saved_sessions_limit();
