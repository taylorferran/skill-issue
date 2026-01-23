-- Skill Issue Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timezone TEXT DEFAULT 'UTC',
  quiet_hours_start INT CHECK (quiet_hours_start >= 0 AND quiet_hours_start <= 23),
  quiet_hours_end INT CHECK (quiet_hours_end >= 0 AND quiet_hours_end <= 23),
  max_challenges_per_day INT DEFAULT 5 CHECK (max_challenges_per_day > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SKILLS TABLE
-- ============================================================================
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty_spec JSONB NOT NULL DEFAULT '{"levels": [1,2,3,4,5,6,7,8,9,10]}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- USER_SKILL_STATE TABLE
-- ============================================================================
CREATE TABLE user_skill_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  difficulty_target INT NOT NULL DEFAULT 2 CHECK (difficulty_target >= 1 AND difficulty_target <= 10),
  streak_correct INT NOT NULL DEFAULT 0,
  streak_incorrect INT NOT NULL DEFAULT 0,
  attempts_total INT NOT NULL DEFAULT 0,
  correct_total INT NOT NULL DEFAULT 0,
  last_challenged_at TIMESTAMPTZ,
  last_result TEXT CHECK (last_result IN ('correct', 'incorrect', 'ignored')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- ============================================================================
-- CHALLENGES TABLE
-- ============================================================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  difficulty INT NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  llm TEXT NOT NULL DEFAULT 'claude-sonnet-4',
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  question TEXT NOT NULL,
  options_json JSONB NOT NULL,
  correct_option INT NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PUSH_EVENTS TABLE
-- ============================================================================
CREATE TABLE push_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'opened')),
  provider_message_id TEXT
);

-- ============================================================================
-- ANSWERS TABLE
-- ============================================================================
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selected_option INT NOT NULL CHECK (selected_option >= 0 AND selected_option <= 3),
  is_correct BOOLEAN NOT NULL,
  response_time INT CHECK (response_time > 0),
  confidence INT CHECK (confidence >= 1 AND confidence <= 5),
  user_feedback TEXT,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCHEDULING_LOG TABLE (for debugging)
-- ============================================================================
CREATE TABLE scheduling_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  decision BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  difficulty_target INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_user_skill_state_user_id ON user_skill_state(user_id);
CREATE INDEX idx_user_skill_state_skill_id ON user_skill_state(skill_id);
CREATE INDEX idx_user_skill_state_last_challenged ON user_skill_state(last_challenged_at);
CREATE INDEX idx_challenges_user_id ON challenges(user_id);
CREATE INDEX idx_challenges_skill_id ON challenges(skill_id);
CREATE INDEX idx_answers_challenge_id ON answers(challenge_id);
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_answers_answered_at ON answers(answered_at);
CREATE INDEX idx_push_events_challenge_id ON push_events(challenge_id);
CREATE INDEX idx_push_events_sent_at ON push_events(sent_at);
CREATE INDEX idx_scheduling_log_created_at ON scheduling_log(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_skill_state_updated_at
  BEFORE UPDATE ON user_skill_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
