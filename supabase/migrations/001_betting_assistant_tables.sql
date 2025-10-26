-- Betting Assistant Cloud Storage Schema (v2 - Casino & Dealer Architecture)
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CASINOS & DEALERS TABLES (User's Personal Database)
-- ============================================================================

-- 1. Casinos Table (User's list of casinos they visit)
CREATE TABLE IF NOT EXISTS casinos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Casino Information
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('online', 'physical')),

  -- Physical Casino Details
  location TEXT, -- City, State, Country
  address TEXT,

  -- Online Casino Details
  website TEXT,
  platform TEXT, -- e.g., "Evolution Gaming", "Playtech"

  -- User Notes
  notes TEXT,
  favorite BOOLEAN DEFAULT false,

  -- Stats (auto-calculated)
  total_sessions INTEGER DEFAULT 0,
  total_profit DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_casino_per_user UNIQUE (user_id, name, type)
);

-- 2. Dealers Table (Dealers at each casino)
CREATE TABLE IF NOT EXISTS dealers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dealer Information
  name TEXT NOT NULL,
  nickname TEXT, -- e.g., "Fast John", "Lucky Maria"

  -- Physical attributes (helps identify dealer)
  gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
  appearance TEXT, -- e.g., "blonde hair, blue shirt"

  -- Schedule (optional)
  typical_shift TEXT, -- e.g., "Nights", "Weekends", "Monday-Friday"

  -- User Notes
  notes TEXT, -- e.g., "Very fast dealer", "Friendly, chatty"
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars

  -- Stats (auto-calculated)
  total_sessions INTEGER DEFAULT 0,
  total_spins INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2), -- Percentage
  total_profit DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_dealer_per_casino UNIQUE (casino_id, name)
);

-- ============================================================================
-- BETTING SESSIONS, CARDS, AND STEPS
-- ============================================================================

-- 3. Betting Sessions Table
CREATE TABLE IF NOT EXISTS betting_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  casino_id UUID REFERENCES casinos(id) ON DELETE SET NULL, -- Optional: Which casino

  -- Session Identity
  session_name TEXT DEFAULT 'Betting Session',

  -- Session Configuration
  config JSONB NOT NULL,
  -- Stores: {
  --   bankroll: number,
  --   totalCards: number,
  --   cardTargetAmount: number,
  --   maxBetsPerCard: number,
  --   bettingSystem: {...},
  --   betGroup: string
  -- }

  -- Session State
  current_card_index INTEGER DEFAULT 0,
  current_bankroll DECIMAL(10,2),
  total_wagered DECIMAL(10,2) DEFAULT 0,
  total_returned DECIMAL(10,2) DEFAULT 0,

  -- Session Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),

  -- Optional: Physical Casino Session Details
  table_number TEXT, -- e.g., "Table 5", "VIP Table 2"
  wheel_number TEXT, -- Some casinos have multiple wheels per table

  -- Session Notes
  notes TEXT, -- User's observations about the session

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Betting Cards Table
CREATE TABLE IF NOT EXISTS betting_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES betting_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Card Identity
  card_number INTEGER NOT NULL,

  -- Card Configuration
  target DECIMAL(10,2) NOT NULL,
  max_bets INTEGER NOT NULL,

  -- Card State
  current_total DECIMAL(10,2) DEFAULT 0,
  bets_used INTEGER DEFAULT 0,
  skips_count INTEGER DEFAULT 0,

  -- Card Status
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed', 'failed')),

  -- Performance Metrics
  discipline_pct DECIMAL(5,2),
  skip_discipline_pct DECIMAL(5,2),

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_card_per_session UNIQUE (session_id, card_number)
);

-- 5. Betting Card Steps Table (Individual Bets/Skips)
CREATE TABLE IF NOT EXISTS betting_card_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES betting_cards(id) ON DELETE CASCADE,
  session_id UUID REFERENCES betting_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dealer_id UUID REFERENCES dealers(id) ON DELETE SET NULL, -- Which dealer was active

  -- Step Identity
  step_number INTEGER NOT NULL,
  bet_number INTEGER, -- null if skipped

  -- Spin Data
  spin_number INTEGER,

  -- Bet Details
  bet_type TEXT, -- 'single' or 'matrix'
  bet_groups JSONB, -- For matrix betting: { red: 5, dozen1: 10 }
  total_stake DECIMAL(10,2),

  -- Outcome
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'push', 'skipped')),
  payout DECIMAL(10,2) DEFAULT 0,
  net_pl DECIMAL(10,2) DEFAULT 0,

  -- Running Totals
  running_card_total DECIMAL(10,2),
  running_bankroll DECIMAL(10,2),

  -- Decision Engine Data
  suggested_action TEXT, -- 'BET', 'SKIP', 'SIT_OUT'
  suggested_side TEXT, -- 'A', 'B'
  confidence DECIMAL(5,2),
  reasons JSONB,

  -- User Action
  user_action TEXT, -- 'bet' or 'skip'
  followed_suggestion BOOLEAN,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_step_per_card UNIQUE (card_id, step_number)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Casinos indexes
CREATE INDEX idx_casinos_user ON casinos(user_id);
CREATE INDEX idx_casinos_type ON casinos(type);
CREATE INDEX idx_casinos_favorite ON casinos(user_id, favorite) WHERE favorite = true;

-- Dealers indexes
CREATE INDEX idx_dealers_casino ON dealers(casino_id);
CREATE INDEX idx_dealers_user ON dealers(user_id);
CREATE INDEX idx_dealers_rating ON dealers(rating DESC);

-- Sessions indexes
CREATE INDEX idx_betting_sessions_user ON betting_sessions(user_id);
CREATE INDEX idx_betting_sessions_casino ON betting_sessions(casino_id);
CREATE INDEX idx_betting_sessions_status ON betting_sessions(status);
CREATE INDEX idx_betting_sessions_activity ON betting_sessions(last_activity_at DESC);

-- Cards indexes
CREATE INDEX idx_betting_cards_session ON betting_cards(session_id);
CREATE INDEX idx_betting_cards_user ON betting_cards(user_id);
CREATE INDEX idx_betting_cards_status ON betting_cards(status);

-- Steps indexes
CREATE INDEX idx_betting_card_steps_card ON betting_card_steps(card_id);
CREATE INDEX idx_betting_card_steps_session ON betting_card_steps(session_id);
CREATE INDEX idx_betting_card_steps_user ON betting_card_steps(user_id);
CREATE INDEX idx_betting_card_steps_dealer ON betting_card_steps(dealer_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE casinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE betting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE betting_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE betting_card_steps ENABLE ROW LEVEL SECURITY;

-- Casinos policies
CREATE POLICY "Users can view own casinos" ON casinos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own casinos" ON casinos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own casinos" ON casinos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own casinos" ON casinos
  FOR DELETE USING (auth.uid() = user_id);

-- Dealers policies
CREATE POLICY "Users can view own dealers" ON dealers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dealers" ON dealers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dealers" ON dealers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dealers" ON dealers
  FOR DELETE USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON betting_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON betting_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON betting_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON betting_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Cards policies
CREATE POLICY "Users can view own cards" ON betting_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" ON betting_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON betting_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON betting_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Steps policies
CREATE POLICY "Users can view own steps" ON betting_card_steps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own steps" ON betting_card_steps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own steps" ON betting_card_steps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own steps" ON betting_card_steps
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_casinos_updated_at
  BEFORE UPDATE ON casinos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dealers_updated_at
  BEFORE UPDATE ON dealers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_betting_sessions_updated_at
  BEFORE UPDATE ON betting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_betting_cards_updated_at
  BEFORE UPDATE ON betting_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Update casino stats when session completes
CREATE OR REPLACE FUNCTION update_casino_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.casino_id IS NOT NULL THEN
    UPDATE casinos
    SET
      total_sessions = total_sessions + 1,
      total_profit = total_profit + (NEW.total_returned - NEW.total_wagered)
    WHERE id = NEW.casino_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_casino_stats_on_session_complete
  AFTER UPDATE ON betting_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_casino_stats();

-- Update dealer stats when steps are added
CREATE OR REPLACE FUNCTION update_dealer_stats()
RETURNS TRIGGER AS $$
DECLARE
  dealer_profit DECIMAL(10,2);
  dealer_wins INTEGER;
  dealer_total INTEGER;
BEGIN
  IF NEW.dealer_id IS NOT NULL THEN
    -- Count total spins and wins for this dealer
    SELECT
      COUNT(*) FILTER (WHERE outcome = 'win'),
      COUNT(*) FILTER (WHERE outcome IN ('win', 'loss'))
    INTO dealer_wins, dealer_total
    FROM betting_card_steps
    WHERE dealer_id = NEW.dealer_id;

    -- Calculate total profit for this dealer
    SELECT COALESCE(SUM(net_pl), 0)
    INTO dealer_profit
    FROM betting_card_steps
    WHERE dealer_id = NEW.dealer_id;

    -- Update dealer stats
    UPDATE dealers
    SET
      total_spins = dealer_total,
      win_rate = CASE
        WHEN dealer_total > 0 THEN (dealer_wins::DECIMAL / dealer_total * 100)
        ELSE 0
      END,
      total_profit = dealer_profit
    WHERE id = NEW.dealer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dealer_stats_on_step_insert
  AFTER INSERT ON betting_card_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_dealer_stats();
