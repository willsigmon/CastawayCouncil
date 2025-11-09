import { z } from "zod";

// Task schemas
export const forageTaskSchema = z.object({
  seasonId: z.string().uuid(),
});

export const forageResultSchema = z.object({
  delta: z.object({
    hunger: z.number(),
    energy: z.number(),
  }),
  narrative: z.string(),
  item: z
    .object({
      id: z.string(),
      type: z.enum(["idol", "tool", "event"]),
    })
    .optional(),
});

export const waterTaskSchema = z.object({
  seasonId: z.string().uuid(),
});

export const waterResultSchema = z.object({
  delta: z.object({
    thirst: z.number(),
  }),
  debuff: z.enum(["tainted_water"]).optional(),
});

export const restTaskSchema = z.object({
  seasonId: z.string().uuid(),
});

export const restResultSchema = z.object({
  delta: z.object({
    energy: z.number(),
  }),
});

export const helpTaskSchema = z.object({
  seasonId: z.string().uuid(),
  targetPlayerId: z.string().uuid(),
});

export const helpResultSchema = z.object({
  delta: z.object({
    social: z.number(),
  }),
});

// Challenge schemas
export const challengeCommitSchema = z.object({
  seasonId: z.string().uuid(),
  day: z.number().int().positive(),
  clientSeedHash: z.string().regex(/^[a-f0-9]{64}$/), // SHA256 hex
});

export const challengeCommitResultSchema = z.object({
  success: z.boolean(),
  committed: z.boolean(),
});

export const challengeScoreInputSchema = z.object({
  challengeId: z.string().uuid(),
});

// Vote schemas
export const voteSchema = z.object({
  seasonId: z.string().uuid(),
  day: z.number().int().positive(),
  targetPlayerId: z.string().uuid(),
});

export const voteResultSchema = z.object({
  success: z.boolean(),
  voteId: z.string().uuid(),
});

// Item schemas
export const playIdolSchema = z.object({
  day: z.number().int().positive(),
});

// Confessional schemas
export const confessionalSchema = z.object({
  seasonId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  visibility: z.enum(["private", "postseason"]).default("private"),
});

// Push subscription schemas
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// Message schemas
export const sendMessageSchema = z.object({
  seasonId: z.string().uuid(),
  channelType: z.enum(["tribe", "dm", "public"]),
  tribeId: z.string().uuid().optional(),
  toPlayerId: z.string().uuid().optional(),
  body: z.string().min(1).max(1000),
});

export const getMessagesSchema = z.object({
  seasonId: z.string().uuid(),
  channelType: z.enum(["tribe", "dm", "public"]),
  tribeId: z.string().uuid().optional(),
  toPlayerId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

// Phase status
export const phaseStatusSchema = z.object({
  seasonId: z.string().uuid(),
  day: z.number().int(),
  phase: z.enum(["camp", "challenge", "vote"]),
  opensAt: z.string().datetime(),
  closesAt: z.string().datetime(),
  isOpen: z.boolean(),
});

export const playerApplicationSchema = z.object({
  q1: z.string().min(1).max(1500),
  q2: z.string().min(1).max(1500),
  q3: z.string().min(1).max(1500),
  q4: z.string().min(1).max(1500),
  q5: z.string().min(1).max(1500),
});

// Alliance Notes
export const AllianceNoteSchema = z.object({
  id: z.string().uuid().optional(),
  seasonId: z.string().uuid(),
  authorId: z.string().uuid(),
  subjectPlayerId: z.string().uuid(),
  note: z.string().min(1).max(2000),
  trustLevel: z.enum(["distrust", "neutral", "ally", "core"]),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
});

// Jury Questions
export const JuryQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  seasonId: z.string().uuid(),
  jurorId: z.string().uuid(),
  finalistId: z.string().uuid(),
  question: z.string().min(10).max(2000),
  answer: z.string().max(4000).optional(),
  answeredAt: z.date().optional(),
});

// Challenge Verification
export const VerifyChallengeSchema = z.object({
  challengeId: z.string().uuid(),
});

// Achievements
export const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  rarity: z.enum(["common", "rare", "legendary"]),
  condition: z.object({
    type: z.string(),
    threshold: z.number(),
  }),
});

// Campaign Events
export const CampaignEventSchema = z.object({
  id: z.string().uuid().optional(),
  seasonId: z.string().uuid(),
  type: z.enum([
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
  ]),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  scheduledDay: z.number().int().positive().optional(),
  scheduledPhase: z.enum(["camp", "challenge", "vote"]).optional(),
  payloadJson: z.record(z.any()).optional(),
  statEffectsJson: z.record(z.record(z.number())).optional(),
});

export const CampaignEventListSchema = z.object({
  seasonId: z.string().uuid(),
  status: z.enum(["pending", "triggered", "all"]).default("all"),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

// Projects
export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  seasonId: z.string().uuid(),
  tribeId: z.string().uuid().optional(),
  playerId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  status: z.enum(["planning", "active", "completed", "abandoned"]).default("planning"),
  targetProgress: z.number().int().positive().default(100),
  requiredResourcesJson: z.record(z.number()).optional(),
  completionRewardsJson: z
    .object({
      statDeltas: z.record(z.number()).optional(),
      items: z.array(z.string().uuid()).optional(),
    })
    .optional(),
});

export const ProjectContributionSchema = z.object({
  projectId: z.string().uuid(),
  resourcesContributedJson: z.record(z.number()).optional(),
  progressAdded: z.number().int().nonnegative().default(0),
});

export const ProjectListSchema = z.object({
  seasonId: z.string().uuid(),
  tribeId: z.string().uuid().optional(),
  playerId: z.string().uuid().optional(),
  status: z.enum(["planning", "active", "completed", "abandoned"]).optional(),
});

// Resources & Inventory
export const ResourceSchema = z.object({
  id: z.string().uuid().optional(),
  seasonId: z.string().uuid(),
  type: z.enum(["food", "water", "materials", "tools", "medicine", "luxury"]),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  stackable: z.boolean().default(true),
  perishable: z.boolean().default(false),
});

export const InventoryUpdateSchema = z.object({
  inventoryId: z.string().uuid(),
  quantityDelta: z.number().int(),
  reason: z.string().min(1).max(100),
  relatedEntityType: z.enum(["action", "project", "event", "trade"]).optional(),
  relatedEntityId: z.string().uuid().optional(),
});

export const InventoryListSchema = z.object({
  seasonId: z.string().uuid(),
  tribeId: z.string().uuid().optional(),
  playerId: z.string().uuid().optional(),
});

// Reveals
export const RevealCommitSchema = z.object({
  revealId: z.string().uuid(),
  commitHash: z.string().regex(/^[a-f0-9]{64}$/), // SHA256 hex
});

export const RevealRevealSchema = z.object({
  revealId: z.string().uuid(),
  revealContentJson: z.record(z.any()),
});

export const RevealSchema = z.object({
  id: z.string().uuid().optional(),
  seasonId: z.string().uuid(),
  type: z.enum(["idol_location", "tribe_swap", "immunity", "custom"]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scheduledDay: z.number().int().positive().optional(),
  scheduledPhase: z.enum(["camp", "challenge", "vote"]).optional(),
  revealContentJson: z.record(z.any()).optional(),
});

export const RevealListSchema = z.object({
  seasonId: z.string().uuid(),
  status: z.enum(["pending", "committed", "revealed", "verified"]).optional(),
});

// Narrative Arcs
export const NarrativeArcSchema = z.object({
  id: z.string().uuid().optional(),
  seasonId: z.string().uuid(),
  playerId: z.string().uuid(),
  arcType: z.enum(["redemption", "villain", "underdog", "leader", "social", "custom"]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  progress: z.number().int().min(0).max(100).default(0),
});

export const NarrativeArcUpdateSchema = z.object({
  arcId: z.string().uuid(),
  progress: z.number().int().min(0).max(100),
  milestone: z
    .object({
      day: z.number().int().positive(),
      event: z.string(),
      progress: z.number().int().min(0).max(100),
    })
    .optional(),
});

// GM Controls
export const GMCadenceControlSchema = z.object({
  seasonId: z.string().uuid(),
  action: z.enum(["pause", "resume", "skip_phase", "extend_phase"]),
  phase: z.enum(["camp", "challenge", "vote"]).optional(),
  durationMs: z.number().int().positive().optional(),
});

export const GMTriggerEventSchema = z.object({
  eventId: z.string().uuid(),
  immediate: z.boolean().default(false),
});

// Trades
export const TradeOfferSchema = z.object({
  id: z.string().uuid().optional(),
  seasonId: z.string().uuid(),
  proposerId: z.string().uuid(),
  recipientId: z.string().uuid(),
  proposerTribeId: z.string().uuid().optional(),
  recipientTribeId: z.string().uuid().optional(),
  resourcesOfferedJson: z.record(z.number()), // { resourceId: quantity }
  resourcesRequestedJson: z.record(z.number()), // { resourceId: quantity }
  message: z.string().max(500).optional(),
});

export const TradeAcceptSchema = z.object({
  tradeId: z.string().uuid(),
});

export const TradeListSchema = z.object({
  seasonId: z.string().uuid(),
  playerId: z.string().uuid().optional(),
  status: z.enum(["pending", "accepted", "rejected", "cancelled"]).optional(),
});

// Crafting
export const CraftingRecipeSchema = z.object({
  id: z.string().uuid().optional(),
  seasonId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  inputsJson: z.record(z.number()), // { resourceId: quantity }
  outputsJson: z.record(z.number()), // { resourceId: quantity }
  craftingTime: z.number().int().positive().default(1),
  skillRequirementsJson: z.record(z.number()).optional(), // { archetype: bonus }
  status: z.enum(["discovered", "hidden"]).default("discovered"),
  prerequisiteRecipeId: z.string().uuid().optional(),
});

export const CraftItemSchema = z.object({
  recipeId: z.string().uuid(),
  seasonId: z.string().uuid(),
});
