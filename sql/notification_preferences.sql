-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE, -- null for global preferences
  notification_type TEXT NOT NULL, -- 'campaign_event', 'project_completed', 'reveal_revealed', 'resource_expiration', 'phase_open'
  enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start INTEGER, -- 0-23, hour of day
  quiet_hours_end INTEGER, -- 0-23, hour of day
  frequency_limit INTEGER, -- max notifications per hour
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, season_id, notification_type)
);

CREATE INDEX IF NOT EXISTS notification_preferences_user_idx ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS notification_preferences_season_idx ON notification_preferences(season_id);

-- RLS Policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences
  FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE id = auth.uid()));

