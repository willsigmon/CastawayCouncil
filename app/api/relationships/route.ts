import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { playerRelationships, players } from '@/drizzle/schema';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';
import {
  updateRelationship,
  getRelationshipTier,
  calculateAllianceStability,
  predictVotePattern,
  detectNaturalAlliances,
  InteractionType,
} from '@game-logic';

const UpdateRelationshipSchema = z.object({
  playerId: z.string().uuid(),
  targetPlayerId: z.string().uuid(),
  interaction: z.enum([
    'chat_message',
    'private_dm',
    'vote_together',
    'vote_against',
    'help_action',
    'share_resource',
    'betrayal',
    'alliance_formed',
    'challenge_cooperation',
    'save_from_vote',
  ]),
  context: z
    .object({
      repeated: z.boolean().optional(),
      public: z.boolean().optional(),
      magnitude: z.number().optional(),
    })
    .optional(),
});

/**
 * GET /api/relationships
 * Get player's relationships
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const includeAnalysis = searchParams.get('analysis') === 'true';

    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    // Get player
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get relationships
    const relationships = await db.query.playerRelationships.findMany({
      where: or(
        eq(playerRelationships.playerId, playerId),
        eq(playerRelationships.targetPlayerId, playerId)
      ),
      with: {
        player: {
          with: {
            user: true,
          },
        },
        targetPlayer: {
          with: {
            user: true,
          },
        },
      },
    });

    // Process relationships
    const processedRelationships = relationships
      .filter((r) => r.playerId === playerId)
      .map((rel) => {
        const tier = getRelationshipTier({
          playerId: rel.playerId,
          targetPlayerId: rel.targetPlayerId,
          trustLevel: rel.trustLevel,
          allianceStrength: rel.allianceStrength,
          interactions: rel.interactions,
          votedTogether: rel.votedTogether,
          votedAgainst: rel.votedAgainst,
          lastInteraction: rel.lastInteraction,
        });

        const stability = calculateAllianceStability({
          playerId: rel.playerId,
          targetPlayerId: rel.targetPlayerId,
          trustLevel: rel.trustLevel,
          allianceStrength: rel.allianceStrength,
          interactions: rel.interactions,
          votedTogether: rel.votedTogether,
          votedAgainst: rel.votedAgainst,
          lastInteraction: rel.lastInteraction,
        });

        const result: any = {
          targetPlayer: {
            id: rel.targetPlayer.id,
            name: rel.targetPlayer.displayName,
            handle: rel.targetPlayer.user.handle,
          },
          trustLevel: rel.trustLevel,
          allianceStrength: rel.allianceStrength,
          interactions: rel.interactions,
          votedTogether: rel.votedTogether,
          votedAgainst: rel.votedAgainst,
          lastInteraction: rel.lastInteraction,
          tier: tier.tier,
          tierDescription: tier.description,
          tierColor: tier.color,
        };

        if (includeAnalysis) {
          result.stability = stability;
          result.votePattern = predictVotePattern(
            playerId,
            relationships.map((r) => ({
              playerId: r.playerId,
              targetPlayerId: r.targetPlayerId,
              trustLevel: r.trustLevel,
              allianceStrength: r.allianceStrength,
              interactions: r.interactions,
              votedTogether: r.votedTogether,
              votedAgainst: r.votedAgainst,
              lastInteraction: r.lastInteraction,
            })),
            rel.targetPlayerId
          );
        }

        return result;
      });

    // Detect natural alliances
    const alliances = detectNaturalAlliances(
      playerId,
      relationships.map((r) => ({
        playerId: r.playerId,
        targetPlayerId: r.targetPlayerId,
        trustLevel: r.trustLevel,
        allianceStrength: r.allianceStrength,
        interactions: r.interactions,
        votedTogether: r.votedTogether,
        votedAgainst: r.votedAgainst,
        lastInteraction: r.lastInteraction,
      }))
    );

    return NextResponse.json({
      relationships: processedRelationships,
      naturalAlliances: alliances,
    });
  } catch (error) {
    console.error('Failed to fetch relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relationships' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/relationships
 * Update relationship based on interaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, targetPlayerId, interaction, context } =
      UpdateRelationshipSchema.parse(body);

    // Get or create relationship
    let relationship = await db.query.playerRelationships.findFirst({
      where: and(
        eq(playerRelationships.playerId, playerId),
        eq(playerRelationships.targetPlayerId, targetPlayerId)
      ),
    });

    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    if (!relationship) {
      // Create new relationship
      const newRel = await db
        .insert(playerRelationships)
        .values({
          seasonId: player.seasonId,
          playerId,
          targetPlayerId,
          trustLevel: 50,
          allianceStrength: 0,
          interactions: 0,
          votedTogether: 0,
          votedAgainst: 0,
        })
        .returning();

      relationship = newRel[0]!;
    }

    // Update relationship
    const updated = updateRelationship(
      {
        playerId: relationship.playerId,
        targetPlayerId: relationship.targetPlayerId,
        trustLevel: relationship.trustLevel,
        allianceStrength: relationship.allianceStrength,
        interactions: relationship.interactions,
        votedTogether: relationship.votedTogether,
        votedAgainst: relationship.votedAgainst,
        lastInteraction: relationship.lastInteraction,
      },
      interaction as InteractionType,
      context
    );

    // Save to database
    await db
      .update(playerRelationships)
      .set({
        trustLevel: updated.trustLevel,
        allianceStrength: updated.allianceStrength,
        interactions: updated.interactions,
        votedTogether: updated.votedTogether,
        votedAgainst: updated.votedAgainst,
        lastInteraction: updated.lastInteraction,
        updatedAt: new Date(),
      })
      .where(eq(playerRelationships.id, relationship.id));

    const tier = getRelationshipTier(updated);

    return NextResponse.json({
      relationship: {
        trustLevel: updated.trustLevel,
        allianceStrength: updated.allianceStrength,
        interactions: updated.interactions,
        tier: tier.tier,
        tierDescription: tier.description,
      },
      changes: {
        interaction,
        tierChanged: tier.tier !== getRelationshipTier({
          ...relationship,
          playerId: relationship.playerId,
          targetPlayerId: relationship.targetPlayerId,
          lastInteraction: relationship.lastInteraction,
        }).tier,
      },
    });
  } catch (error) {
    console.error('Failed to update relationship:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update relationship' },
      { status: 500 }
    );
  }
}
