import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// Enums
export const seasonStatusEnum = pgEnum("season_status", ["planned", "active", "complete"]);
export const gameModeEnum = pgEnum("game_mode", ["classic", "speed", "hardcore", "casual"]);
export const characterArchetypeEnum = pgEnum("character_archetype", [
  "hunter",
  "strategist",
  "builder",
  "medic",
  "leader",
  "scout",
]);
export const playerRoleEnum = pgEnum("player_role", ["contestant", "jury", "spectator"]);
export const channelTypeEnum = pgEnum("channel_type", ["tribe", "dm", "public"]);
export const itemTypeEnum = pgEnum("item_type", ["idol", "tool", "event"]);
export const challengeTypeEnum = pgEnum("challenge_type", ["team", "individual"]);
export const subjectTypeEnum = pgEnum("subject_type", ["player", "tribe"]);
export const eventKindEnum = pgEnum("event_kind", [
  "phase_open",
  "phase_close",
  "idol_found",
  "storm",
  "swap",
  "eliminate",
  "merge",
  "medevac",
]);
export const applicationStatusEnum = pgEnum("application_status", ["shortlist", "not_considered"]);
export const campaignEventTypeEnum = pgEnum("campaign_event_type", [
  "storm",
  "supply_drop",
  "wildlife_encounter",
  "tribe_swap",
  "exile_island",
  "reward_challenge",
  "immunity_idol_clue",
  "social_twist",
  "resource_discovery",
  "custom",
]);
export const projectStatusEnum = pgEnum("project_status", ["planning", "active", "completed", "abandoned"]);
export const resourceTypeEnum = pgEnum("resource_type", [
  "food",
  "water",
  "materials",
  "tools",
  "medicine",
  "luxury",
]);
export const revealStatusEnum = pgEnum("reveal_status", ["pending", "committed", "revealed", "verified"]);
export const tradeStatusEnum = pgEnum("trade_status", ["pending", "accepted", "rejected", "cancelled"]);
export const craftingRecipeStatusEnum = pgEnum("crafting_recipe_status", ["discovered", "hidden"]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  handle: text("handle").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playerApplications = pgTable(
  "player_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    q1: text("q1").notNull(),
    q2: text("q2").notNull(),
    q3: text("q3").notNull(),
    q4: text("q4").notNull(),
    q5: text("q5").notNull(),
    status: applicationStatusEnum("status").notNull().default("shortlist"),
    wordScore: integer("word_score").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userUnique: uniqueIndex("player_applications_user_idx").on(table.userId),
  })
);

export const seasons = pgTable(
  "seasons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    status: seasonStatusEnum("status").notNull().default("planned"),
    gameMode: gameModeEnum("game_mode").notNull().default("classic"),
    startAt: timestamp("start_at"),
    dayIndex: integer("day_index").notNull().default(0),
  },
  (table) => ({
    statusIdx: index("seasons_status_idx").on(table.status),
  })
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    displayName: text("display_name").notNull(),
    archetype: characterArchetypeEnum("archetype").notNull().default("hunter"),
    eliminatedAt: timestamp("eliminated_at"),
    evacuatedAt: timestamp("evacuated_at"),
    evacuationReason: text("evacuation_reason"), // 'inactivity' | 'medical'
    lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
    role: playerRoleEnum("role").notNull().default("contestant"),
    isGM: boolean("is_gm").notNull().default(false),
  },
  (table) => ({
    userIdIdx: index("players_user_id_idx").on(table.userId),
    seasonIdIdx: index("players_season_id_idx").on(table.seasonId),
  })
);

export const tribes = pgTable("tribes", {
  id: uuid("id").primaryKey().defaultRandom(),
  seasonId: uuid("season_id").notNull().references(() => seasons.id),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const tribeMembers = pgTable(
  "tribe_members",
  {
    tribeId: uuid("tribe_id")
      .notNull()
      .references(() => tribes.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: index("tribe_members_pk").on(table.tribeId, table.playerId),
  })
);

export const alliances = pgTable("alliances", {
  id: uuid("id").primaryKey().defaultRandom(),
  seasonId: uuid("season_id").notNull().references(() => seasons.id),
  name: text("name").notNull(),
});

export const allianceMembers = pgTable(
  "alliance_members",
  {
    allianceId: uuid("alliance_id")
      .notNull()
      .references(() => alliances.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: index("alliance_members_pk").on(table.allianceId, table.playerId),
  })
);

export const stats = pgTable(
  "stats",
  {
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    day: integer("day").notNull(),
    energy: integer("energy").notNull().default(100),
    hunger: integer("hunger").notNull().default(100),
    thirst: integer("thirst").notNull().default(100),
    social: integer("social").notNull().default(50),
  },
  (table) => ({
    pk: index("stats_pk").on(table.playerId, table.day),
  })
);

export const debuffs = pgTable(
  "debuffs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    day: integer("day").notNull(),
    kind: text("kind").notNull(), // 'exhausted', 'critically_exhausted', 'starving', 'dehydrated', 'tainted_water', 'heat_stroke', 'injured'
    severity: integer("severity").notNull().default(1), // 1-3
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    playerIdx: index("debuffs_player_idx").on(table.playerId),
    activeIdx: index("debuffs_active_idx").on(table.playerId, table.expiresAt),
  })
);

export const actions = pgTable(
  "actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    day: integer("day").notNull(),
    actionType: text("action_type").notNull(), // 'forage', 'fish', 'water', 'rest', 'help', 'build', 'explore', 'craft'
    success: boolean("success").notNull(),
    outcomeText: text("outcome_text").notNull(),
    statDeltas: jsonb("stat_deltas"), // { energy: 10, hunger: -5 }
    targetPlayerId: uuid("target_player_id").references(() => players.id), // For help action
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    playerDayIdx: index("actions_player_day_idx").on(table.playerId, table.day),
    seasonDayIdx: index("actions_season_day_idx").on(table.seasonId, table.day),
  })
);

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  seasonId: uuid("season_id").notNull().references(() => seasons.id),
  type: itemTypeEnum("type").notNull(),
  ownerPlayerId: uuid("owner_player_id").references(() => players.id),
  hiddenLocation: text("hidden_location"),
  charges: integer("charges").default(1),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    channelType: channelTypeEnum("channel_type").notNull(),
    tribeId: uuid("tribe_id").references(() => tribes.id),
    fromPlayerId: uuid("from_player_id").notNull().references(() => players.id),
    toPlayerId: uuid("to_player_id").references(() => players.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    seasonIdx: index("messages_season_idx").on(table.seasonId),
    tribeIdx: index("messages_tribe_idx").on(table.tribeId),
    channelIdx: index("messages_channel_idx").on(table.channelType, table.seasonId),
  })
);

export const confessionals = pgTable(
  "confessionals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id").notNull().references(() => players.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    visibility: text("visibility").notNull().default("private"), // 'private' | 'postseason'
  },
  (table) => ({
    playerIdx: index("confessionals_player_idx").on(table.playerId),
  })
);

export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  seasonId: uuid("season_id").notNull().references(() => seasons.id),
  day: integer("day").notNull(),
  type: challengeTypeEnum("type").notNull(),
  encountersJson: jsonb("encounters_json").notNull(),
  seedCommit: text("seed_commit"), // SHA256 hash of server seed
  serverSeed: text("server_seed"), // Revealed after commit phase closes
  clientSeedsJson: jsonb("client_seeds_json"), // playerId -> client_seed (revealed after commit phase)
});

export const challengeCommits = pgTable(
  "challenge_commits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
    playerId: uuid("player_id").notNull().references(() => players.id),
    clientSeedHash: text("client_seed_hash").notNull(), // SHA256 hash
    clientSeed: text("client_seed"), // Revealed after commit phase closes
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    challengePlayerIdx: index("challenge_commits_challenge_player_idx").on(table.challengeId, table.playerId),
  })
);

export const challengeResults = pgTable(
  "challenge_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id").notNull().references(() => challenges.id),
    subjectType: subjectTypeEnum("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    roll: integer("roll").notNull(),
    modifiersJson: jsonb("modifiers_json"),
    total: integer("total").notNull(),
  },
  (table) => ({
    challengeIdx: index("challenge_results_challenge_idx").on(table.challengeId),
  })
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    day: integer("day").notNull(),
    voterPlayerId: uuid("voter_player_id").notNull().references(() => players.id),
    targetPlayerId: uuid("target_player_id").notNull().references(() => players.id),
    idolPlayed: boolean("idol_played").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    revealedAt: timestamp("revealed_at"),
  },
  (table) => ({
    seasonDayIdx: index("votes_season_day_idx").on(table.seasonId, table.day),
    voterIdx: index("votes_voter_idx").on(table.voterPlayerId),
  })
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    day: integer("day").notNull(),
    kind: eventKindEnum("kind").notNull(),
    payloadJson: jsonb("payload_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    seasonDayIdx: index("events_season_day_idx").on(table.seasonId, table.day),
    kindIdx: index("events_kind_idx").on(table.kind),
  })
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    userId: uuid("user_id").notNull().references(() => users.id),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("push_subscriptions_user_idx").on(table.userId),
  })
);

export const allianceNotes = pgTable(
  "alliance_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    authorId: uuid("author_id").notNull().references(() => players.id),
    subjectPlayerId: uuid("subject_player_id").notNull().references(() => players.id),
    note: text("note").notNull(),
    trustLevel: text("trust_level").notNull(), // 'distrust' | 'neutral' | 'ally' | 'core'
    tags: text("tags").array().default([]),
    pinned: boolean("pinned").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    authorIdx: index("alliance_notes_author_idx").on(table.authorId),
    seasonIdx: index("alliance_notes_season_idx").on(table.seasonId),
  })
);

export const juryQuestions = pgTable(
  "jury_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    jurorId: uuid("juror_id").notNull().references(() => players.id),
    finalistId: uuid("finalist_id").notNull().references(() => players.id),
    question: text("question").notNull(),
    answer: text("answer"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    answeredAt: timestamp("answered_at"),
  },
  (table) => ({
    seasonIdx: index("jury_questions_season_idx").on(table.seasonId),
    finalistIdx: index("jury_questions_finalist_idx").on(table.finalistId),
  })
);

// Campaign Events - GM-injected events that affect gameplay
export const campaignEvents = pgTable(
  "campaign_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    type: campaignEventTypeEnum("type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    scheduledDay: integer("scheduled_day"),
    scheduledPhase: text("scheduled_phase"), // 'camp' | 'challenge' | 'vote' | null (immediate)
    triggeredAt: timestamp("triggered_at"),
    triggeredBy: uuid("triggered_by").references(() => players.id), // GM player ID
    payloadJson: jsonb("payload_json"), // Event-specific data
    statEffectsJson: jsonb("stat_effects_json"), // { playerId: { energy: -10, hunger: 5 } }
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    seasonIdx: index("campaign_events_season_idx").on(table.seasonId),
    scheduledIdx: index("campaign_events_scheduled_idx").on(table.scheduledDay, table.scheduledPhase),
    triggeredIdx: index("campaign_events_triggered_idx").on(table.triggeredAt),
  })
);

// Event Templates - Reusable event definitions
export const eventTemplates = pgTable("event_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: campaignEventTypeEnum("type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  defaultPayloadJson: jsonb("default_payload_json"),
  defaultStatEffectsJson: jsonb("default_stat_effects_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Projects - Long-term tribe/player projects (shelters, tools, etc.)
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    tribeId: uuid("tribe_id").references(() => tribes.id), // null for player projects
    playerId: uuid("player_id").references(() => players.id), // null for tribe projects
    name: text("name").notNull(),
    description: text("description").notNull(),
    status: projectStatusEnum("status").notNull().default("planning"),
    progress: integer("progress").notNull().default(0), // 0-100
    targetProgress: integer("target_progress").notNull().default(100),
    requiredResourcesJson: jsonb("required_resources_json"), // { resourceType: quantity }
    completionRewardsJson: jsonb("completion_rewards_json"), // { statDeltas: {...}, items: [...] }
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    seasonIdx: index("projects_season_idx").on(table.seasonId),
    tribeIdx: index("projects_tribe_idx").on(table.tribeId),
    playerIdx: index("projects_player_idx").on(table.playerId),
  })
);

// Project Contributions - Track player contributions to projects
export const projectContributions = pgTable(
  "project_contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    day: integer("day").notNull(),
    resourcesContributedJson: jsonb("resources_contributed_json"), // { resourceType: quantity }
    progressAdded: integer("progress_added").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("project_contributions_project_idx").on(table.projectId),
    playerDayIdx: index("project_contributions_player_day_idx").on(table.playerId, table.day),
  })
);

// Resources - Inventory items (food, water, materials, etc.)
export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  seasonId: uuid("season_id").notNull().references(() => seasons.id),
  type: resourceTypeEnum("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  stackable: boolean("stackable").notNull().default(true),
  perishable: boolean("perishable").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inventories - Player/tribe resource holdings
export const inventories = pgTable(
  "inventories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    tribeId: uuid("tribe_id").references(() => tribes.id), // null for player inventory
    playerId: uuid("player_id").references(() => players.id), // null for tribe inventory
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index("inventories_owner_idx").on(table.tribeId, table.playerId),
    resourceIdx: index("inventories_resource_idx").on(table.resourceId),
    seasonIdx: index("inventories_season_idx").on(table.seasonId),
  })
);

// Resource Transactions - Audit trail for resource changes
export const resourceTransactions = pgTable(
  "resource_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    inventoryId: uuid("inventory_id")
      .notNull()
      .references(() => inventories.id, { onDelete: "cascade" }),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id),
    quantityDelta: integer("quantity_delta").notNull(), // positive for gain, negative for loss
    reason: text("reason").notNull(), // 'forage', 'project_contribution', 'campaign_event', 'trade', etc.
    relatedEntityType: text("related_entity_type"), // 'action', 'project', 'event', 'trade'
    relatedEntityId: uuid("related_entity_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    inventoryIdx: index("resource_transactions_inventory_idx").on(table.inventoryId),
    seasonIdx: index("resource_transactions_season_idx").on(table.seasonId),
  })
);

// Reveals - Commit-reveal protocol for GM-controlled reveals
export const reveals = pgTable(
  "reveals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    type: text("type").notNull(), // 'idol_location', 'tribe_swap', 'immunity', 'custom'
    title: text("title").notNull(),
    description: text("description"),
    status: revealStatusEnum("status").notNull().default("pending"),
    commitHash: text("commit_hash"), // SHA256 hash of reveal content
    revealContentJson: jsonb("reveal_content_json"), // Revealed after commit phase
    scheduledDay: integer("scheduled_day"),
    scheduledPhase: text("scheduled_phase"),
    revealedAt: timestamp("revealed_at"),
    revealedBy: uuid("revealed_by").references(() => players.id), // GM player ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    seasonIdx: index("reveals_season_idx").on(table.seasonId),
    statusIdx: index("reveals_status_idx").on(table.status),
    scheduledIdx: index("reveals_scheduled_idx").on(table.scheduledDay, table.scheduledPhase),
  })
);

// Narrative Arcs - Persistent character development tracking
export const narrativeArcs = pgTable(
  "narrative_arcs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    arcType: text("arc_type").notNull(), // 'redemption', 'villain', 'underdog', 'leader', 'social', 'custom'
    title: text("title").notNull(),
    description: text("description"),
    progress: integer("progress").notNull().default(0), // 0-100
    milestonesJson: jsonb("milestones_json"), // [{ day: 5, event: "...", progress: 25 }]
    isActive: boolean("is_active").notNull().default(true),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    playerIdx: index("narrative_arcs_player_idx").on(table.playerId),
    seasonIdx: index("narrative_arcs_season_idx").on(table.seasonId),
    activeIdx: index("narrative_arcs_active_idx").on(table.isActive),
  })
);

// Trades - Player-to-player and tribe resource trading
export const trades = pgTable(
  "trades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    proposerId: uuid("proposer_id").notNull().references(() => players.id),
    recipientId: uuid("recipient_id").notNull().references(() => players.id),
    proposerTribeId: uuid("proposer_tribe_id").references(() => tribes.id), // null for player trades
    recipientTribeId: uuid("recipient_tribe_id").references(() => tribes.id), // null for player trades
    resourcesOfferedJson: jsonb("resources_offered_json").notNull(), // { resourceId: quantity }
    resourcesRequestedJson: jsonb("resources_requested_json").notNull(), // { resourceId: quantity }
    status: tradeStatusEnum("status").notNull().default("pending"),
    message: text("message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at"),
    rejectedAt: timestamp("rejected_at"),
    cancelledAt: timestamp("cancelled_at"),
  },
  (table) => ({
    seasonIdx: index("trades_season_idx").on(table.seasonId),
    proposerIdx: index("trades_proposer_idx").on(table.proposerId),
    recipientIdx: index("trades_recipient_idx").on(table.recipientId),
    statusIdx: index("trades_status_idx").on(table.status),
  })
);

// Crafting Recipes - Define recipes for crafting items
export const craftingRecipes = pgTable(
  "crafting_recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    name: text("name").notNull(),
    description: text("description"),
    inputsJson: jsonb("inputs_json").notNull(), // { resourceId: quantity }
    outputsJson: jsonb("outputs_json").notNull(), // { resourceId: quantity }
    craftingTime: integer("crafting_time").notNull().default(1), // days
    skillRequirementsJson: jsonb("skill_requirements_json"), // { archetype: bonus }
    status: craftingRecipeStatusEnum("status").notNull().default("discovered"),
    prerequisiteRecipeId: uuid("prerequisite_recipe_id").references(() => craftingRecipes.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    seasonIdx: index("crafting_recipes_season_idx").on(table.seasonId),
    statusIdx: index("crafting_recipes_status_idx").on(table.status),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  players: many(players),
  pushSubscriptions: many(pushSubscriptions),
  applications: many(playerApplications),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  players: many(players),
  tribes: many(tribes),
  challenges: many(challenges),
  votes: many(votes),
  events: many(events),
  items: many(items),
  messages: many(messages),
  debuffs: many(debuffs),
  actions: many(actions),
  campaignEvents: many(campaignEvents),
  projects: many(projects),
  resources: many(resources),
  inventories: many(inventories),
  reveals: many(reveals),
  narrativeArcs: many(narrativeArcs),
  trades: many(trades),
  craftingRecipes: many(craftingRecipes),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  user: one(users, {
    fields: [players.userId],
    references: [users.id],
  }),
  season: one(seasons, {
    fields: [players.seasonId],
    references: [seasons.id],
  }),
  stats: many(stats),
  debuffs: many(debuffs),
  actions: many(actions),
  votesCast: many(votes, { relationName: "votesCast" }),
  votesReceived: many(votes, { relationName: "votesReceived" }),
  projects: many(projects),
  projectContributions: many(projectContributions),
  inventories: many(inventories),
  narrativeArcs: many(narrativeArcs),
  triggeredEvents: many(campaignEvents, { relationName: "triggeredEvents" }),
  revealedReveals: many(reveals, { relationName: "revealedReveals" }),
  tradesProposed: many(trades, { relationName: "tradesProposed" }),
  tradesReceived: many(trades, { relationName: "tradesReceived" }),
}));

export const debuffsRelations = relations(debuffs, ({ one }) => ({
  player: one(players, {
    fields: [debuffs.playerId],
    references: [players.id],
  }),
  season: one(seasons, {
    fields: [debuffs.seasonId],
    references: [seasons.id],
  }),
}));

export const actionsRelations = relations(actions, ({ one }) => ({
  player: one(players, {
    fields: [actions.playerId],
    references: [players.id],
  }),
  season: one(seasons, {
    fields: [actions.seasonId],
    references: [seasons.id],
  }),
  targetPlayer: one(players, {
    fields: [actions.targetPlayerId],
    references: [players.id],
  }),
}));

export const playerApplicationsRelations = relations(playerApplications, ({ one }) => ({
  user: one(users, {
    fields: [playerApplications.userId],
    references: [users.id],
  }),
}));

export const tribesRelations = relations(tribes, ({ one, many }) => ({
  season: one(seasons, {
    fields: [tribes.seasonId],
    references: [seasons.id],
  }),
  members: many(tribeMembers),
  projects: many(projects),
  inventories: many(inventories),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  season: one(seasons, {
    fields: [projects.seasonId],
    references: [seasons.id],
  }),
  tribe: one(tribes, {
    fields: [projects.tribeId],
    references: [tribes.id],
  }),
  player: one(players, {
    fields: [projects.playerId],
    references: [players.id],
  }),
  contributions: many(projectContributions),
}));

export const projectContributionsRelations = relations(projectContributions, ({ one }) => ({
  project: one(projects, {
    fields: [projectContributions.projectId],
    references: [projects.id],
  }),
  player: one(players, {
    fields: [projectContributions.playerId],
    references: [players.id],
  }),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  season: one(seasons, {
    fields: [resources.seasonId],
    references: [seasons.id],
  }),
  inventories: many(inventories),
  transactions: many(resourceTransactions),
}));

export const inventoriesRelations = relations(inventories, ({ one, many }) => ({
  season: one(seasons, {
    fields: [inventories.seasonId],
    references: [seasons.id],
  }),
  tribe: one(tribes, {
    fields: [inventories.tribeId],
    references: [tribes.id],
  }),
  player: one(players, {
    fields: [inventories.playerId],
    references: [players.id],
  }),
  resource: one(resources, {
    fields: [inventories.resourceId],
    references: [resources.id],
  }),
  transactions: many(resourceTransactions),
}));

export const resourceTransactionsRelations = relations(resourceTransactions, ({ one }) => ({
  season: one(seasons, {
    fields: [resourceTransactions.seasonId],
    references: [seasons.id],
  }),
  inventory: one(inventories, {
    fields: [resourceTransactions.inventoryId],
    references: [inventories.id],
  }),
  resource: one(resources, {
    fields: [resourceTransactions.resourceId],
    references: [resources.id],
  }),
}));

export const campaignEventsRelations = relations(campaignEvents, ({ one }) => ({
  season: one(seasons, {
    fields: [campaignEvents.seasonId],
    references: [seasons.id],
  }),
  triggeredByPlayer: one(players, {
    fields: [campaignEvents.triggeredBy],
    references: [players.id],
  }),
}));

export const revealsRelations = relations(reveals, ({ one }) => ({
  season: one(seasons, {
    fields: [reveals.seasonId],
    references: [seasons.id],
  }),
  revealedByPlayer: one(players, {
    fields: [reveals.revealedBy],
    references: [players.id],
  }),
}));

export const narrativeArcsRelations = relations(narrativeArcs, ({ one }) => ({
  season: one(seasons, {
    fields: [narrativeArcs.seasonId],
    references: [seasons.id],
  }),
  player: one(players, {
    fields: [narrativeArcs.playerId],
    references: [players.id],
  }),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  season: one(seasons, {
    fields: [trades.seasonId],
    references: [seasons.id],
  }),
  proposer: one(players, {
    fields: [trades.proposerId],
    references: [players.id],
    relationName: "tradesProposed",
  }),
  recipient: one(players, {
    fields: [trades.recipientId],
    references: [players.id],
    relationName: "tradesReceived",
  }),
  proposerTribe: one(tribes, {
    fields: [trades.proposerTribeId],
    references: [tribes.id],
  }),
  recipientTribe: one(tribes, {
    fields: [trades.recipientTribeId],
    references: [tribes.id],
  }),
}));

export const craftingRecipesRelations = relations(craftingRecipes, ({ one }) => ({
  season: one(seasons, {
    fields: [craftingRecipes.seasonId],
    references: [seasons.id],
  }),
  prerequisite: one(craftingRecipes, {
    fields: [craftingRecipes.prerequisiteRecipeId],
    references: [craftingRecipes.id],
  }),
}));
