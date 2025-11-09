# Campaign Upgrade Implementation Summary

## Overview

This document summarizes the comprehensive campaign-scale upgrades implemented for Castaway Council, transforming it from a fixed seasonal cadence into a dynamic, GM-controlled, long-form campaign system inspired by D&D and Survivor.

## Phase 1: Data Model & Backend Foundations ✅

### Database Schema Extensions

**New Tables:**
- `campaign_events` - GM-injected events (storms, supply drops, twists, etc.)
- `event_templates` - Reusable event definitions
- `projects` - Long-term tribe/player projects (shelters, tools, etc.)
- `project_contributions` - Track player contributions to projects
- `resources` - Inventory item definitions (food, water, materials, etc.)
- `inventories` - Player/tribe resource holdings
- `resource_transactions` - Audit trail for resource changes
- `reveals` - Commit-reveal protocol for GM-controlled reveals
- `narrative_arcs` - Persistent character development tracking

**New Enums:**
- `campaign_event_type` - storm, supply_drop, wildlife_encounter, tribe_swap, exile_island, reward_challenge, immunity_idol_clue, social_twist, resource_discovery, custom
- `project_status` - planning, active, completed, abandoned
- `resource_type` - food, water, materials, tools, medicine, luxury
- `reveal_status` - pending, committed, revealed, verified

### Helper Functions (`app/_server/db/helpers.ts`)

**Campaign Events:**
- `createCampaignEvent()` - Create new campaign event
- `triggerCampaignEvent()` - Trigger scheduled or immediate event
- `getCampaignEvents()` - List events with filters

**Projects:**
- `createProject()` - Create tribe or player project
- `contributeToProject()` - Add player contribution (resources/progress)
- `getProjects()` - List projects with filters

**Resources & Inventory:**
- `createResource()` - Define new resource type
- `getOrCreateInventory()` - Get or create inventory slot
- `updateInventory()` - Update inventory quantity with transaction log
- `getInventory()` - List inventory items

**Reveals:**
- `createReveal()` - Create new reveal
- `commitReveal()` - Commit reveal hash (commit-reveal protocol)
- `revealContent()` - Reveal content after commit phase
- `getReveals()` - List reveals with filters

**Narrative Arcs:**
- `createNarrativeArc()` - Start new character arc
- `updateNarrativeArc()` - Update arc progress with milestones
- `getNarrativeArcs()` - List arcs with filters

### Zod Schemas (`packages/schemas/index.ts`)

Added comprehensive validation schemas for:
- Campaign events (create, list, trigger)
- Projects (create, contribute, list)
- Resources & inventory (create, update, list)
- Reveals (create, commit, reveal, list)
- Narrative arcs (create, update, list)
- GM controls (cadence control, trigger events)

## Phase 2: API Layer & Automation ✅

### API Routes

**Campaign Events:**
- `GET /api/campaign/events` - List campaign events
- `POST /api/campaign/events` - Create campaign event
- `POST /api/campaign/events/trigger` - Trigger event immediately

**Reveals:**
- `GET /api/reveal` - List reveals
- `POST /api/reveal` - Create reveal
- `POST /api/reveal/commit` - Commit reveal hash
- `POST /api/reveal/reveal` - Reveal content

**GM Controls:**
- `POST /api/gm/cadence` - Control season cadence (pause, resume, skip, extend)

**Projects:**
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `POST /api/projects/contribute` - Contribute to project

**Inventory:**
- `GET /api/inventory` - List inventory
- `POST /api/inventory` - Update inventory quantity

### Temporal Activities (`infra/temporal/activities.ts`)

**New Activities:**
- `checkScheduledEvents()` - Check and trigger events scheduled for current day/phase
- `advanceProjects()` - Apply passive progress to active projects
- `tickResources()` - Process resource expiration and decay

### Temporal Workflows (`infra/temporal/workflows.ts`)

**Enhanced Workflow:**
- Integrated event checking at each phase transition
- Resource ticking during camp phase
- Project advancement during camp phase
- Dynamic event injection support

**Workflow Flow:**
```
For each day:
  1. Camp phase opens
     - Check scheduled events for camp phase
     - Tick resources (expiration/decay)
     - Advance projects (passive progress)
     - Sleep for camp duration

  2. Challenge phase opens
     - Check scheduled events for challenge phase
     - Sleep for challenge duration
     - Score challenge

  3. Vote phase opens
     - Check scheduled events for vote phase
     - Sleep for vote duration
     - Tally votes

  4. Daily summary emitted
```

## Phase 3: Frontend & UX ✅

### SeasonTimeline Component Upgrade

**Enhanced Features:**
- Displays phase timeline (camp, challenge, vote)
- Shows campaign events with icons and status
- Displays active projects with progress bars
- Visual indicators for triggered vs pending events
- Color-coded sections (phases, events, projects)

**Data Sources:**
- `/api/season/timeline` - Phase timeline
- `/api/campaign/events` - Campaign events
- `/api/projects` - Active projects

### StatHUD Component Enhancement

**New Features:**
- Displays active project progress bars in HUD
- Shows up to 2 projects with overflow indicator
- Fetches player projects automatically when seasonId/playerId provided

### PlayerStatsCard Component Enhancement

**New Features:**
- Displays player inventory with resource icons
- Shows resource quantities and types
- Grid layout for inventory items
- Separate section for inventory below stats

### GM Console Page (`app/(season)/gm/page.tsx`)

**Features:**
- Tabbed interface (Events, Projects, Reveals)
- Campaign event management with trigger buttons
- Project status and progress visualization
- Reveal status tracking
- Real-time data fetching from APIs

### Narrative Arc System (`packages/game-logic/narratives.ts`)

**New Functions:**
- `calculateArcProgress()` - Calculate arc progress from actions/events
- `getActionContribution()` - Get progress contribution from actions
- `getEventContribution()` - Get progress contribution from events
- `generateArcMilestoneText()` - Generate narrative text for milestones

**Arc Types Supported:**
- Redemption, Villain, Underdog, Leader, Social, Custom

**Progress Calculation:**
- Actions contribute based on arc type and success level
- Events contribute based on arc type
- Progress tracked 0-100 with milestones

## Implementation Status

### ✅ Completed
- [x] Database schema extensions (9 new tables)
- [x] Helper functions for all new entities
- [x] Zod validation schemas
- [x] API routes (campaign events, reveals, GM controls, projects, inventory)
- [x] Temporal activities (event checking, project advancement, resource ticking)
- [x] Temporal workflow integration
- [x] SeasonTimeline component upgrade
- [x] StatHUD project indicators
- [x] PlayerStatsCard inventory display
- [x] GM console page (`app/(season)/gm/page.tsx`)
- [x] Narrative arc progression system (`packages/game-logic/narratives.ts`)

### 🔄 Optional Enhancements
- [ ] GM role/permission checking (currently allows any authenticated user)
- [ ] Project contribution forms UI
- [ ] Reveal commit/reveal UI components
- [ ] Resource management UI forms
- [ ] RLS policies for new tables
- [ ] Integration tests
- [ ] E2E tests for campaign flows

## Key Features

### Campaign Events
- **Scheduled Events**: Events can be scheduled for specific days/phases
- **Immediate Events**: Events can be triggered instantly
- **Stat Effects**: Events can modify player stats (energy, hunger, thirst, social)
- **Event Types**: Storm, supply drop, wildlife encounter, tribe swap, exile island, reward challenge, immunity idol clue, social twist, resource discovery, custom

### Projects
- **Tribe Projects**: Shared projects requiring multiple players
- **Player Projects**: Individual projects
- **Progress Tracking**: 0-100 progress with target milestones
- **Resource Requirements**: Projects can require specific resources
- **Completion Rewards**: Stat bonuses and items on completion

### Resources & Inventory
- **Resource Types**: Food, water, materials, tools, medicine, luxury
- **Perishable Resources**: Resources can expire and decay
- **Transaction Log**: Full audit trail of resource changes
- **Tribe vs Player**: Separate inventories for tribes and players

### Reveals
- **Commit-Reveal Protocol**: Fair reveal system using hash commits
- **Scheduled Reveals**: Reveals can be scheduled for specific times
- **Verification**: Reveals can be verified against commit hashes

### Narrative Arcs
- **Character Development**: Track player character arcs
- **Arc Types**: Redemption, villain, underdog, leader, social, custom
- **Milestones**: Track arc progression with day/event milestones
- **Progress**: 0-100 progress tracking

## Architecture Decisions

1. **System Triggers**: Campaign events triggered by Temporal workflows use `null` for `triggeredBy` to indicate system automation
2. **Transaction Logging**: All resource changes are logged in `resource_transactions` for auditability
3. **Flexible Scheduling**: Events and reveals support both immediate and scheduled execution
4. **Progress Tracking**: Projects and arcs use 0-100 progress scales for consistency
5. **JSON Payloads**: Event-specific data stored in JSONB for flexibility

## Next Steps

1. **GM Permissions**: Implement role-based access control for GM actions
2. **Frontend Polish**: Complete UI components for all new features
3. **RLS Policies**: Add Row Level Security policies for new tables
4. **Testing**: Add comprehensive test coverage
5. **Documentation**: Update user-facing documentation
6. **Performance**: Optimize queries and add caching where needed

## Migration Notes

**Database Migrations Required:**
- Run migrations for new tables and enums
- Backfill default resources for existing seasons (optional)
- Create RLS policies for new tables

**Breaking Changes:**
- None - all changes are additive

**Backward Compatibility:**
- Existing seasons continue to work without campaign features
- Campaign features are opt-in per season
