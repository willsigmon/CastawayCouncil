-- Performance optimization indexes for campaign features

-- Campaign events indexes
CREATE INDEX IF NOT EXISTS campaign_events_season_status_idx ON campaign_events(season_id, status);
CREATE INDEX IF NOT EXISTS campaign_events_scheduled_idx ON campaign_events(scheduled_day, scheduled_phase) WHERE scheduled_day IS NOT NULL;
CREATE INDEX IF NOT EXISTS campaign_events_triggered_idx ON campaign_events(triggered_at) WHERE triggered_at IS NOT NULL;

-- Projects indexes
CREATE INDEX IF NOT EXISTS projects_season_status_idx ON projects(season_id, status);
CREATE INDEX IF NOT EXISTS projects_tribe_status_idx ON projects(tribe_id, status) WHERE tribe_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS projects_player_status_idx ON projects(player_id, status) WHERE player_id IS NOT NULL;

-- Inventory indexes
CREATE INDEX IF NOT EXISTS inventories_season_resource_idx ON inventories(season_id, resource_id);
CREATE INDEX IF NOT EXISTS inventories_player_resource_idx ON inventories(player_id, resource_id) WHERE player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS inventories_tribe_resource_idx ON inventories(tribe_id, resource_id) WHERE tribe_id IS NOT NULL;

-- Resource transactions indexes
CREATE INDEX IF NOT EXISTS resource_transactions_season_created_idx ON resource_transactions(season_id, created_at DESC);
CREATE INDEX IF NOT EXISTS resource_transactions_inventory_reason_idx ON resource_transactions(inventory_id, reason);

-- Trades indexes
CREATE INDEX IF NOT EXISTS trades_season_status_created_idx ON trades(season_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS trades_proposer_status_idx ON trades(proposer_id, status);
CREATE INDEX IF NOT EXISTS trades_recipient_status_idx ON trades(recipient_id, status);

-- Crafting recipes indexes
CREATE INDEX IF NOT EXISTS crafting_recipes_season_status_idx ON crafting_recipes(season_id, status);
CREATE INDEX IF NOT EXISTS crafting_recipes_prerequisite_idx ON crafting_recipes(prerequisite_recipe_id) WHERE prerequisite_recipe_id IS NOT NULL;

-- Narrative arcs indexes
CREATE INDEX IF NOT EXISTS narrative_arcs_season_player_active_idx ON narrative_arcs(season_id, player_id, is_active);
CREATE INDEX IF NOT EXISTS narrative_arcs_progress_idx ON narrative_arcs(progress DESC) WHERE is_active = true;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS campaign_events_list_idx ON campaign_events(season_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_list_idx ON projects(season_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS trades_list_idx ON trades(season_id, status, created_at DESC);

