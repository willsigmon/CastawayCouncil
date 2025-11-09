-- RLS Policies for Campaign System Tables
-- Run this migration after creating campaign tables

-- Enable RLS on campaign tables
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE narrative_arcs ENABLE ROW LEVEL SECURITY;

-- Campaign Events RLS
-- Season participants can read all events
CREATE POLICY "campaign_events_select"
  ON campaign_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = campaign_events.season_id
      AND p.user_id = auth.uid()
    )
  );

-- GM can create/update/trigger events
CREATE POLICY "campaign_events_insert"
  ON campaign_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = campaign_events.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

CREATE POLICY "campaign_events_update"
  ON campaign_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = campaign_events.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

-- Projects RLS
-- Tribe members can read tribe projects
CREATE POLICY "projects_select_tribe"
  ON projects FOR SELECT
  USING (
    tribe_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM tribe_members tm
      JOIN players p ON p.id = tm.player_id
      WHERE tm.tribe_id = projects.tribe_id
      AND p.user_id = auth.uid()
    )
  );

-- Players can read own projects
CREATE POLICY "projects_select_own"
  ON projects FOR SELECT
  USING (
    player_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = projects.player_id
      AND p.user_id = auth.uid()
    )
  );

-- GM can read all projects
CREATE POLICY "projects_select_gm"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = projects.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

-- Players can create own projects
CREATE POLICY "projects_insert_own"
  ON projects FOR INSERT
  WITH CHECK (
    player_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = projects.player_id
      AND p.user_id = auth.uid()
    )
  );

-- GM can create any project
CREATE POLICY "projects_insert_gm"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = projects.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

-- Project Contributions RLS
-- Players can read contributions to accessible projects
CREATE POLICY "project_contributions_select"
  ON project_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects pr
      WHERE pr.id = project_contributions.project_id
      AND (
        pr.player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
        OR pr.tribe_id IN (
          SELECT tribe_id FROM tribe_members tm
          JOIN players p ON p.id = tm.player_id
          WHERE p.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM players p
          WHERE p.season_id = pr.season_id
          AND p.user_id = auth.uid()
          AND p.is_gm = true
        )
      )
    )
  );

-- Players can contribute to accessible projects
CREATE POLICY "project_contributions_insert"
  ON project_contributions FOR INSERT
  WITH CHECK (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM projects pr
      WHERE pr.id = project_contributions.project_id
      AND (
        pr.player_id = project_contributions.player_id
        OR pr.tribe_id IN (
          SELECT tribe_id FROM tribe_members tm
          WHERE tm.player_id = project_contributions.player_id
        )
      )
    )
  );

-- Inventories RLS
-- Players can read own inventory
CREATE POLICY "inventories_select_own"
  ON inventories FOR SELECT
  USING (
    player_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = inventories.player_id
      AND p.user_id = auth.uid()
    )
  );

-- Tribe members can read tribe inventory
CREATE POLICY "inventories_select_tribe"
  ON inventories FOR SELECT
  USING (
    tribe_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM tribe_members tm
      JOIN players p ON p.id = tm.player_id
      WHERE tm.tribe_id = inventories.tribe_id
      AND p.user_id = auth.uid()
    )
  );

-- GM can read all inventories
CREATE POLICY "inventories_select_gm"
  ON inventories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = inventories.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

-- System/actions can update inventories (via API with proper auth)
-- GM can update any inventory
CREATE POLICY "inventories_update_gm"
  ON inventories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = inventories.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

-- Resources RLS
-- Season participants can read resources
CREATE POLICY "resources_select"
  ON resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = resources.season_id
      AND p.user_id = auth.uid()
    )
  );

-- GM can create resources
CREATE POLICY "resources_insert"
  ON resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = resources.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

-- Resource Transactions RLS
-- Players can read transactions for their inventories
CREATE POLICY "resource_transactions_select"
  ON resource_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inventories inv
      WHERE inv.id = resource_transactions.inventory_id
      AND (
        inv.player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
        OR inv.tribe_id IN (
          SELECT tribe_id FROM tribe_members tm
          JOIN players p ON p.id = tm.player_id
          WHERE p.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM players p
          WHERE p.season_id = inv.season_id
          AND p.user_id = auth.uid()
          AND p.is_gm = true
        )
      )
    )
  );

-- System can insert transactions (via API with proper auth)
-- GM can insert transactions
CREATE POLICY "resource_transactions_insert_gm"
  ON resource_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inventories inv
      JOIN players p ON p.season_id = inv.season_id
      WHERE inv.id = resource_transactions.inventory_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

-- Reveals RLS
-- Season participants can read reveals
CREATE POLICY "reveals_select"
  ON reveals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = reveals.season_id
      AND p.user_id = auth.uid()
    )
  );

-- GM can create/commit/reveal
CREATE POLICY "reveals_insert"
  ON reveals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = reveals.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

CREATE POLICY "reveals_update"
  ON reveals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = reveals.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

-- Narrative Arcs RLS
-- Players can read own arcs
CREATE POLICY "narrative_arcs_select_own"
  ON narrative_arcs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = narrative_arcs.player_id
      AND p.user_id = auth.uid()
    )
  );

-- GM can read all arcs
CREATE POLICY "narrative_arcs_select_gm"
  ON narrative_arcs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = narrative_arcs.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

-- Players can create/update own arcs
CREATE POLICY "narrative_arcs_insert"
  ON narrative_arcs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = narrative_arcs.player_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "narrative_arcs_update"
  ON narrative_arcs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = narrative_arcs.player_id
      AND p.user_id = auth.uid()
    )
  );

-- GM can create/update any arc
CREATE POLICY "narrative_arcs_insert_gm"
  ON narrative_arcs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = narrative_arcs.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );

CREATE POLICY "narrative_arcs_update_gm"
  ON narrative_arcs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.season_id = narrative_arcs.season_id
      AND p.user_id = auth.uid()
      AND p.is_gm = true
    )
  );
