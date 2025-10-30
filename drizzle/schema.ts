import { pgTable, text, timestamp, integer, jsonb, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const seasonStatusEnum = pgEnum('season_status', ['planned', 'active', 'complete']);
export const playerRoleEnum = pgEnum('player_role', ['contestant', 'jury', 'spectator']);
export const itemTypeEnum = pgEnum('item_type', ['idol', 'tool', 'event']);
export const channelTypeEnum = pgEnum('channel_type', ['tribe', 'dm', 'public']);
export const confessionalVisibilityEnum = pgEnum('confessional_visibility', ['private', 'postseason']);
export const challengeTypeEnum = pgEnum('challenge_type', ['team', 'individual']);
export const subjectTypeEnum = pgEnum('subject_type', ['player', 'tribe']);
export const eventKindEnum = pgEnum('event_kind', [
  'phase_open',
  'phase_close',
  'idol_found',
  'storm',
  'swap',
  'eliminate',
  'merge',
]);

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Players table
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  displayName: text('display_name').notNull(),
  eliminatedAt: timestamp('eliminated_at'),
  role: playerRoleEnum('role').notNull().default('contestant'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tribes table
export const tribes = pgTable('tribes', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tribe members junction table
export const tribeMembers = pgTable('tribe_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tribeId: uuid('tribe_id').notNull().references(() => tribes.id),
  playerId: uuid('player_id').notNull().references(() => players.id),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
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
export const stats = pgTable('stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  day: integer('day').notNull(),
  energy: integer('energy').notNull().default(100),
  hunger: integer('hunger').notNull().default(100),
  thirst: integer('thirst').notNull().default(100),
  social: integer('social').notNull().default(50),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Items table (idols, tools, event items)
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  type: itemTypeEnum('type').notNull(),
  ownerPlayerId: uuid('owner_player_id').references(() => players.id),
  hiddenLocation: text('hidden_location'),
  charges: integer('charges').notNull().default(1),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Messages table (tribe chat, DMs, public log)
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  channelType: channelTypeEnum('channel_type').notNull(),
  tribeId: uuid('tribe_id').references(() => tribes.id),
  fromPlayerId: uuid('from_player_id').notNull().references(() => players.id),
  toPlayerId: uuid('to_player_id').references(() => players.id),
  body: text('body').notNull(),
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
  encountersJson: jsonb('encounters_json').notNull(),
  seedCommit: text('seed_commit'),
  serverSeed: text('server_seed'),
  scoredAt: timestamp('scored_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Challenge results table
export const challengeResults = pgTable('challenge_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id),
  subjectType: subjectTypeEnum('subject_type').notNull(),
  subjectId: uuid('subject_id').notNull(), // player_id or tribe_id
  roll: integer('roll').notNull(),
  modifiersJson: jsonb('modifiers_json'),
  total: integer('total').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Votes table
export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  day: integer('day').notNull(),
  voterPlayerId: uuid('voter_player_id').notNull().references(() => players.id),
  targetPlayerId: uuid('target_player_id').notNull().references(() => players.id),
  idolPlayed: boolean('idol_played').notNull().default(false),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  players: many(players),
  pushSubscriptions: many(pushSubscriptions),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  players: many(players),
  tribes: many(tribes),
  alliances: many(alliances),
  items: many(items),
  messages: many(messages),
  challenges: many(challenges),
  votes: many(votes),
  events: many(events),
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
  ownedItems: many(items),
  messagesSent: many(messages),
  confessionals: many(confessionals),
  votesGiven: many(votes, { relationName: 'voter' }),
  votesReceived: many(votes, { relationName: 'target' }),
}));

export const tribesRelations = relations(tribes, ({ one, many }) => ({
  season: one(seasons, {
    fields: [tribes.seasonId],
    references: [seasons.id],
  }),
  members: many(tribeMembers),
  messages: many(messages),
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

export const itemsRelations = relations(items, ({ one }) => ({
  season: one(seasons, {
    fields: [items.seasonId],
    references: [seasons.id],
  }),
  owner: one(players, {
    fields: [items.ownerPlayerId],
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

export const confessionalsRelations = relations(confessionals, ({ one }) => ({
  player: one(players, {
    fields: [confessionals.playerId],
    references: [players.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  season: one(seasons, {
    fields: [challenges.seasonId],
    references: [seasons.id],
  }),
  results: many(challengeResults),
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
