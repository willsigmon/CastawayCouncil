import { pgTable, text, timestamp, integer, jsonb, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const seasonStatusEnum = pgEnum('season_status', ['planned', 'active', 'complete']);
export const playerRoleEnum = pgEnum('player_role', ['contestant', 'jury', 'spectator', 'finalist']);
export const playerClassEnum = pgEnum('player_class', [
  'athlete',
  'strategist',
  'survivalist',
  'opportunist',
  'diplomat',
  'wildcard',
]);
export const itemTypeEnum = pgEnum('item_type', ['advantage', 'tool', 'food', 'material']);
export const channelTypeEnum = pgEnum('channel_type', ['tribe', 'action', 'challenge', 'tribal', 'dm', 'public']);
export const confessionalVisibilityEnum = pgEnum('confessional_visibility', ['private', 'postseason']);
export const challengeTypeEnum = pgEnum('challenge_type', ['team', 'individual', 'reward']);
export const subjectTypeEnum = pgEnum('subject_type', ['player', 'tribe']);
export const eventKindEnum = pgEnum('event_kind', [
  'phase_open',
  'phase_close',
  'advantage_found',
  'advantage_played',
  'storm',
  'swap',
  'eliminate',
  'merge',
  'medical_evac',
  'finale',
  'weather_change',
  'random_event',
  'camp_upgrade',
  'crafting',
  'secret_mission_assigned',
  'secret_mission_completed',
  'rumor_started',
]);
export const weatherTypeEnum = pgEnum('weather_type', ['sunny', 'rain', 'heat', 'storm', 'cold']);
export const upgradeTypeEnum = pgEnum('upgrade_type', ['shelter', 'fire', 'trap', 'tool_station', 'water_filter', 'storage']);
export const randomEventTypeEnum = pgEnum('random_event_type', [
  'injury',
  'animal_encounter',
  'lost_supplies',
  'mysterious_clue',
  'supply_drop',
  'tribal_visit',
  'food_spoilage',
]);
export const missionStatusEnum = pgEnum('mission_status', ['assigned', 'in_progress', 'completed', 'failed', 'expired']);
export const inventoryTypeEnum = pgEnum('inventory_type', ['personal', 'tribe']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  handle: text('handle').notNull().unique(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Seasons table
export const seasons = pgTable('seasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: seasonStatusEnum('status').notNull().default('planned'),
  startAt: timestamp('start_at'),
  dayIndex: integer('day_index').notNull().default(0),
  totalDays: integer('total_days').notNull().default(15),
  mergeAt: integer('merge_at').notNull().default(12), // Merge when 12 players remain
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Players table
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  displayName: text('display_name').notNull(),
  playerClass: playerClassEnum('player_class').notNull(),
  eliminatedAt: timestamp('eliminated_at'),
  role: playerRoleEnum('role').notNull().default('contestant'),
  // Wildcard daily ability (for wildcard class)
  wildcardAbility: playerClassEnum('wildcard_ability'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tribes table
export const tribes = pgTable('tribes', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  name: text('name').notNull(),
  color: text('color').notNull(),
  disbanded: boolean('disbanded').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tribe members junction table
export const tribeMembers = pgTable('tribe_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tribeId: uuid('tribe_id').notNull().references(() => tribes.id),
  playerId: uuid('player_id').notNull().references(() => players.id),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
});

// Alliances table
export const alliances = pgTable('alliances', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Alliance members junction table
export const allianceMembers = pgTable('alliance_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  allianceId: uuid('alliance_id').notNull().references(() => alliances.id),
  playerId: uuid('player_id').notNull().references(() => players.id),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Stats table (daily player stats)
// NEW: Hunger/Thirst/Comfort/Energy system
export const stats = pgTable('stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  day: integer('day').notNull(),
  hunger: integer('hunger').notNull().default(100),
  thirst: integer('thirst').notNull().default(100),
  comfort: integer('comfort').notNull().default(100),
  energy: integer('energy').notNull().default(100), // Average of hunger/thirst/comfort
  medicalAlert: boolean('medical_alert').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Inventory table (personal and tribe inventories)
export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  inventoryType: inventoryTypeEnum('inventory_type').notNull(),
  ownerId: uuid('owner_id').notNull(), // player_id or tribe_id
  itemType: itemTypeEnum('item_type').notNull(),
  itemName: text('item_name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  metadata: jsonb('metadata'), // For item-specific data
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Advantages table (hidden advantages in camps)
export const advantages = pgTable('advantages', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  tribeId: uuid('tribe_id').references(() => tribes.id), // Which camp it's hidden in
  advantageType: text('advantage_type').notNull(), // 'immunity', 'vote_steal', 'extra_vote', etc.
  hiddenLocation: text('hidden_location'), // Flavor text
  foundByPlayerId: uuid('found_by_player_id').references(() => players.id),
  playedAt: timestamp('played_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Messages table (tribe chat, action chat, challenge chat, tribal chat, DMs)
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  channelType: channelTypeEnum('channel_type').notNull(),
  tribeId: uuid('tribe_id').references(() => tribes.id),
  fromPlayerId: uuid('from_player_id').references(() => players.id), // Null for system messages
  toPlayerId: uuid('to_player_id').references(() => players.id), // For DMs
  body: text('body').notNull(),
  isSystemMessage: boolean('is_system_message').notNull().default(false),
  metadata: jsonb('metadata'), // For action logs (e.g., what was gathered)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Confessionals table
export const confessionals = pgTable('confessionals', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  body: text('body').notNull(),
  visibility: confessionalVisibilityEnum('visibility').notNull().default('private'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Challenges table
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  day: integer('day').notNull(),
  type: challengeTypeEnum('type').notNull(),
  challengeName: text('challenge_name').notNull(), // e.g., "Tower of Ten"
  description: text('description').notNull(),
  rulesJson: jsonb('rules_json').notNull(), // Challenge-specific rules
  stateJson: jsonb('state_json'), // Current challenge state
  scoredAt: timestamp('scored_at'),
  winnerSubjectType: subjectTypeEnum('winner_subject_type'),
  winnerSubjectId: uuid('winner_subject_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Challenge submissions (player/tribe actions during challenge)
export const challengeSubmissions = pgTable('challenge_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id),
  subjectType: subjectTypeEnum('subject_type').notNull(),
  subjectId: uuid('subject_id').notNull(),
  submissionData: jsonb('submission_data').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

// Challenge results table
export const challengeResults = pgTable('challenge_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id),
  subjectType: subjectTypeEnum('subject_type').notNull(),
  subjectId: uuid('subject_id').notNull(),
  score: integer('score').notNull(),
  placement: integer('placement'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Votes table
export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  day: integer('day').notNull(),
  voterPlayerId: uuid('voter_player_id').notNull().references(() => players.id),
  targetPlayerId: uuid('target_player_id').notNull().references(() => players.id),
  advantagePlayed: boolean('advantage_played').notNull().default(false),
  revealedAt: timestamp('revealed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Events table (event sourcing for phase changes and major events)
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  day: integer('day').notNull(),
  kind: eventKindEnum('kind').notNull(),
  payloadJson: jsonb('payload_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Push subscriptions table
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Weather events table
export const weatherEvents = pgTable('weather_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  day: integer('day').notNull(),
  weatherType: weatherTypeEnum('weather_type').notNull(),
  severity: integer('severity').notNull().default(1), // 1-3: mild, moderate, severe
  hungerModifier: integer('hunger_modifier').notNull().default(0), // e.g., -10 for heat
  thirstModifier: integer('thirst_modifier').notNull().default(0),
  comfortModifier: integer('comfort_modifier').notNull().default(0),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Camp upgrades table
export const campUpgrades = pgTable('camp_upgrades', {
  id: uuid('id').primaryKey().defaultRandom(),
  tribeId: uuid('tribe_id').notNull().references(() => tribes.id),
  upgradeType: upgradeTypeEnum('upgrade_type').notNull(),
  level: integer('level').notNull().default(1), // Can upgrade multiple times
  resourceCost: jsonb('resource_cost').notNull(), // e.g., { firewood: 5, coconut: 3 }
  benefits: jsonb('benefits').notNull(), // e.g., { comfortBonus: 5, findRateBonus: 10 }
  builtAt: timestamp('built_at').defaultNow().notNull(),
  builtBy: uuid('built_by').notNull().references(() => players.id),
});

// Random events table
export const randomEvents = pgTable('random_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  day: integer('day').notNull(),
  eventType: randomEventTypeEnum('event_type').notNull(),
  targetType: subjectTypeEnum('target_type').notNull(), // 'player' or 'tribe'
  targetId: uuid('target_id').notNull(),
  description: text('description').notNull(),
  effects: jsonb('effects').notNull(), // Stat changes, item losses, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Crafting recipes table (defines what can be crafted)
export const craftingRecipes = pgTable('crafting_recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  ingredients: jsonb('ingredients').notNull(), // e.g., [{ item: 'vine', quantity: 2 }, { item: 'stick', quantity: 1 }]
  resultItem: text('result_item').notNull(), // e.g., 'fishing_rod'
  resultQuantity: integer('result_quantity').notNull().default(1),
  unlockCondition: text('unlock_condition'), // Optional: conditions to unlock recipe
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Crafted items log table (tracks when items are crafted)
export const craftingLog = pgTable('crafting_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  recipeId: uuid('recipe_id').notNull().references(() => craftingRecipes.id),
  craftedAt: timestamp('crafted_at').defaultNow().notNull(),
});

// Secret missions table
export const secretMissions = pgTable('secret_missions', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  day: integer('day').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  objective: jsonb('objective').notNull(), // e.g., { type: 'vote_for', target: 'player-id' }
  reward: jsonb('reward').notNull(), // e.g., { statBonus: { comfort: 10 }, advantage: true }
  status: missionStatusEnum('status').notNull().default('assigned'),
  expiresAt: timestamp('expires_at').notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Player relationships table (for trust meter)
export const playerRelationships = pgTable('player_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  playerId: uuid('player_id').notNull().references(() => players.id),
  targetPlayerId: uuid('target_player_id').notNull().references(() => players.id),
  trustLevel: integer('trust_level').notNull().default(50), // 0-100
  allianceStrength: integer('alliance_strength').notNull().default(0), // 0-100
  lastInteraction: timestamp('last_interaction'),
  interactions: integer('interactions').notNull().default(0),
  votedTogether: integer('voted_together').notNull().default(0),
  votedAgainst: integer('voted_against').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Rumors table
export const rumors = pgTable('rumors', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  day: integer('day').notNull(),
  content: text('content').notNull(), // e.g., "Someone found an advantage at camp"
  truthful: boolean('truthful').notNull(), // Is this rumor actually true?
  targetPlayerId: uuid('target_player_id').references(() => players.id), // Optional: about specific player
  visibleTo: text('visible_to').notNull().default('all'), // 'all', 'tribe:id', 'player:id'
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Confessional insights table (tracks "insight points" from confessionals)
export const confessionalInsights = pgTable('confessional_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  confessionalId: uuid('confessional_id').notNull().references(() => confessionals.id),
  playerId: uuid('player_id').notNull().references(() => players.id),
  insightPoints: integer('insight_points').notNull().default(1),
  category: text('category'), // e.g., 'strategy', 'social', 'observation'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations (same as before, updated where needed)
export const usersRelations = relations(users, ({ many }) => ({
  players: many(players),
  pushSubscriptions: many(pushSubscriptions),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  players: many(players),
  tribes: many(tribes),
  alliances: many(alliances),
  messages: many(messages),
  challenges: many(challenges),
  votes: many(votes),
  events: many(events),
  advantages: many(advantages),
  inventory: many(inventory),
  weatherEvents: many(weatherEvents),
  randomEvents: many(randomEvents),
  secretMissions: many(secretMissions),
  playerRelationships: many(playerRelationships),
  rumors: many(rumors),
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
  tribeMembers: many(tribeMembers),
  allianceMembers: many(allianceMembers),
  stats: many(stats),
  messagesSent: many(messages),
  confessionals: many(confessionals),
  votesGiven: many(votes, { relationName: 'voter' }),
  votesReceived: many(votes, { relationName: 'target' }),
  campUpgradesBuilt: many(campUpgrades),
  craftingLogs: many(craftingLog),
  secretMissions: many(secretMissions),
  relationshipsFrom: many(playerRelationships, { relationName: 'relationship_from' }),
  relationshipsTo: many(playerRelationships, { relationName: 'relationship_to' }),
  confessionalInsights: many(confessionalInsights),
}));

export const tribesRelations = relations(tribes, ({ one, many }) => ({
  season: one(seasons, {
    fields: [tribes.seasonId],
    references: [seasons.id],
  }),
  members: many(tribeMembers),
  messages: many(messages),
  advantages: many(advantages),
  campUpgrades: many(campUpgrades),
}));

export const tribeMembersRelations = relations(tribeMembers, ({ one }) => ({
  tribe: one(tribes, {
    fields: [tribeMembers.tribeId],
    references: [tribes.id],
  }),
  player: one(players, {
    fields: [tribeMembers.playerId],
    references: [players.id],
  }),
}));

export const alliancesRelations = relations(alliances, ({ one, many }) => ({
  season: one(seasons, {
    fields: [alliances.seasonId],
    references: [seasons.id],
  }),
  members: many(allianceMembers),
}));

export const allianceMembersRelations = relations(allianceMembers, ({ one }) => ({
  alliance: one(alliances, {
    fields: [allianceMembers.allianceId],
    references: [alliances.id],
  }),
  player: one(players, {
    fields: [allianceMembers.playerId],
    references: [players.id],
  }),
}));

export const statsRelations = relations(stats, ({ one }) => ({
  player: one(players, {
    fields: [stats.playerId],
    references: [players.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  season: one(seasons, {
    fields: [inventory.seasonId],
    references: [seasons.id],
  }),
}));

export const advantagesRelations = relations(advantages, ({ one }) => ({
  season: one(seasons, {
    fields: [advantages.seasonId],
    references: [seasons.id],
  }),
  tribe: one(tribes, {
    fields: [advantages.tribeId],
    references: [tribes.id],
  }),
  foundBy: one(players, {
    fields: [advantages.foundByPlayerId],
    references: [players.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  season: one(seasons, {
    fields: [messages.seasonId],
    references: [seasons.id],
  }),
  tribe: one(tribes, {
    fields: [messages.tribeId],
    references: [tribes.id],
  }),
  fromPlayer: one(players, {
    fields: [messages.fromPlayerId],
    references: [players.id],
  }),
  toPlayer: one(players, {
    fields: [messages.toPlayerId],
    references: [players.id],
  }),
}));

export const confessionalsRelations = relations(confessionals, ({ one, many }) => ({
  player: one(players, {
    fields: [confessionals.playerId],
    references: [players.id],
  }),
  insights: many(confessionalInsights),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  season: one(seasons, {
    fields: [challenges.seasonId],
    references: [seasons.id],
  }),
  submissions: many(challengeSubmissions),
  results: many(challengeResults),
}));

export const challengeSubmissionsRelations = relations(challengeSubmissions, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeSubmissions.challengeId],
    references: [challenges.id],
  }),
}));

export const challengeResultsRelations = relations(challengeResults, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeResults.challengeId],
    references: [challenges.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  season: one(seasons, {
    fields: [votes.seasonId],
    references: [seasons.id],
  }),
  voter: one(players, {
    fields: [votes.voterPlayerId],
    references: [players.id],
    relationName: 'voter',
  }),
  target: one(players, {
    fields: [votes.targetPlayerId],
    references: [players.id],
    relationName: 'target',
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  season: one(seasons, {
    fields: [events.seasonId],
    references: [seasons.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const weatherEventsRelations = relations(weatherEvents, ({ one }) => ({
  season: one(seasons, {
    fields: [weatherEvents.seasonId],
    references: [seasons.id],
  }),
}));

export const campUpgradesRelations = relations(campUpgrades, ({ one }) => ({
  tribe: one(tribes, {
    fields: [campUpgrades.tribeId],
    references: [tribes.id],
  }),
  builder: one(players, {
    fields: [campUpgrades.builtBy],
    references: [players.id],
  }),
}));

export const randomEventsRelations = relations(randomEvents, ({ one }) => ({
  season: one(seasons, {
    fields: [randomEvents.seasonId],
    references: [seasons.id],
  }),
}));

export const craftingRecipesRelations = relations(craftingRecipes, ({ many }) => ({
  craftingLogs: many(craftingLog),
}));

export const craftingLogRelations = relations(craftingLog, ({ one }) => ({
  player: one(players, {
    fields: [craftingLog.playerId],
    references: [players.id],
  }),
  recipe: one(craftingRecipes, {
    fields: [craftingLog.recipeId],
    references: [craftingRecipes.id],
  }),
}));

export const secretMissionsRelations = relations(secretMissions, ({ one }) => ({
  player: one(players, {
    fields: [secretMissions.playerId],
    references: [players.id],
  }),
  season: one(seasons, {
    fields: [secretMissions.seasonId],
    references: [seasons.id],
  }),
}));

export const playerRelationshipsRelations = relations(playerRelationships, ({ one }) => ({
  season: one(seasons, {
    fields: [playerRelationships.seasonId],
    references: [seasons.id],
  }),
  player: one(players, {
    fields: [playerRelationships.playerId],
    references: [players.id],
    relationName: 'relationship_from',
  }),
  targetPlayer: one(players, {
    fields: [playerRelationships.targetPlayerId],
    references: [players.id],
    relationName: 'relationship_to',
  }),
}));

export const rumorsRelations = relations(rumors, ({ one }) => ({
  season: one(seasons, {
    fields: [rumors.seasonId],
    references: [seasons.id],
  }),
  targetPlayer: one(players, {
    fields: [rumors.targetPlayerId],
    references: [players.id],
  }),
}));

export const confessionalInsightsRelations = relations(confessionalInsights, ({ one }) => ({
  confessional: one(confessionals, {
    fields: [confessionalInsights.confessionalId],
    references: [confessionals.id],
  }),
  player: one(players, {
    fields: [confessionalInsights.playerId],
    references: [players.id],
  }),
}));
