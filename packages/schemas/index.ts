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
