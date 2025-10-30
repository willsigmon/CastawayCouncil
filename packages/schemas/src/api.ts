import { z } from 'zod';

// Task API schemas
export const ForageRequestSchema = z.object({
  playerId: z.string().uuid(),
});

export const ForageResponseSchema = z.object({
  delta: z.object({
    hunger: z.number().int(),
    energy: z.number().int().optional(),
  }),
  item: z
    .object({
      id: z.string().uuid(),
      type: z.enum(['idol', 'tool', 'event']),
    })
    .optional(),
});

export const WaterRequestSchema = z.object({
  playerId: z.string().uuid(),
});

export const WaterResponseSchema = z.object({
  delta: z.object({
    thirst: z.number().int(),
  }),
  debuff: z.string().optional(),
});

export const RestRequestSchema = z.object({
  playerId: z.string().uuid(),
});

export const RestResponseSchema = z.object({
  delta: z.object({
    energy: z.number().int(),
  }),
});

export const HelpRequestSchema = z.object({
  playerId: z.string().uuid(),
  targetPlayerId: z.string().uuid(),
});

export const HelpResponseSchema = z.object({
  targetPlayerId: z.string().uuid(),
  delta: z.object({
    social: z.number().int(),
  }),
});

// Challenge API schemas
export const ChallengeCommitRequestSchema = z.object({
  playerId: z.string().uuid(),
  challengeId: z.string().uuid(),
  clientSeedHash: z.string().length(64),
});

export const ChallengeCommitResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Vote API schemas
export const VoteRequestSchema = z.object({
  voterId: z.string().uuid(),
  targetPlayerId: z.string().uuid(),
  day: z.number().int().positive(),
});

export const VoteResponseSchema = z.object({
  success: z.boolean(),
  voteId: z.string().uuid(),
});

// Idol play schema
export const PlayIdolRequestSchema = z.object({
  playerId: z.string().uuid(),
  itemId: z.string().uuid(),
  day: z.number().int().positive(),
});

export const PlayIdolResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Confessional schema
export const ConfessionalRequestSchema = z.object({
  playerId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  visibility: z.enum(['private', 'postseason']).default('private'),
});

export const ConfessionalResponseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(),
});

// Push subscription schema
export const PushSubscribeRequestSchema = z.object({
  userId: z.string().uuid(),
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const PushSubscribeResponseSchema = z.object({
  success: z.boolean(),
  subscriptionId: z.string().uuid(),
});

export type ForageRequest = z.infer<typeof ForageRequestSchema>;
export type ForageResponse = z.infer<typeof ForageResponseSchema>;
export type WaterRequest = z.infer<typeof WaterRequestSchema>;
export type WaterResponse = z.infer<typeof WaterResponseSchema>;
export type RestRequest = z.infer<typeof RestRequestSchema>;
export type RestResponse = z.infer<typeof RestResponseSchema>;
export type HelpRequest = z.infer<typeof HelpRequestSchema>;
export type HelpResponse = z.infer<typeof HelpResponseSchema>;
export type ChallengeCommitRequest = z.infer<typeof ChallengeCommitRequestSchema>;
export type ChallengeCommitResponse = z.infer<typeof ChallengeCommitResponseSchema>;
export type VoteRequest = z.infer<typeof VoteRequestSchema>;
export type VoteResponse = z.infer<typeof VoteResponseSchema>;
export type PlayIdolRequest = z.infer<typeof PlayIdolRequestSchema>;
export type PlayIdolResponse = z.infer<typeof PlayIdolResponseSchema>;
export type ConfessionalRequest = z.infer<typeof ConfessionalRequestSchema>;
export type ConfessionalResponse = z.infer<typeof ConfessionalResponseSchema>;
export type PushSubscribeRequest = z.infer<typeof PushSubscribeRequestSchema>;
export type PushSubscribeResponse = z.infer<typeof PushSubscribeResponseSchema>;
