import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { advantages, votes, players, messages } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const PlayAdvantageSchema = z.object({
  playerId: z.string().uuid(),
  advantageId: z.string().uuid(),
  day: z.number().int().positive(),
  // For vote steal/extra vote: specify target
  targetVotePlayerId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, advantageId, day, targetVotePlayerId } = PlayAdvantageSchema.parse(body);

    // Get player
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
      with: {
        season: true,
        tribeMembers: { with: { tribe: true } },
      },
    });

    if (!player || player.eliminatedAt) {
      return NextResponse.json({ error: 'Player not found or eliminated' }, { status: 404 });
    }

    // Get advantage
    const advantage = await db.query.advantages.findFirst({
      where: eq(advantages.id, advantageId),
    });

    if (!advantage) {
      return NextResponse.json({ error: 'Advantage not found' }, { status: 404 });
    }

    if (advantage.foundByPlayerId !== playerId) {
      return NextResponse.json({ error: 'You do not own this advantage' }, { status: 403 });
    }

    if (advantage.playedAt) {
      return NextResponse.json({ error: 'Advantage already played' }, { status: 400 });
    }

    // Apply advantage effect based on type
    let effect = '';

    switch (advantage.advantageType) {
      case 'immunity':
        // Mark all votes against this player as negated
        await db
          .update(votes)
          .set({ advantagePlayed: true })
          .where(and(eq(votes.targetPlayerId, playerId), eq(votes.day, day)));
        effect = `${player.displayName} played an IMMUNITY advantage! All votes against them are negated.`;
        break;

      case 'vote_steal':
        if (!targetVotePlayerId) {
          return NextResponse.json(
            { error: 'Target player required for vote steal' },
            { status: 400 }
          );
        }
        // Cancel target's vote and give player an extra vote
        await db
          .update(votes)
          .set({ advantagePlayed: true })
          .where(
            and(eq(votes.voterPlayerId, targetVotePlayerId), eq(votes.day, day))
          );
        effect = `${player.displayName} played a VOTE STEAL advantage! They stole the vote from another player.`;
        break;

      case 'extra_vote':
        // Metadata can track that this player gets 2 votes this tribal
        effect = `${player.displayName} played an EXTRA VOTE advantage! Their vote counts twice.`;
        break;

      default:
        effect = `${player.displayName} played an advantage!`;
    }

    // Mark advantage as played
    await db
      .update(advantages)
      .set({
        playedAt: new Date(),
        metadata: { day, targetVotePlayerId },
      })
      .where(eq(advantages.id, advantageId));

    // Post to tribal chat
    const tribeId = player.tribeMembers[0]?.tribe.id;
    if (tribeId) {
      await db.insert(messages).values({
        seasonId: player.seasonId,
        channelType: 'tribal',
        tribeId,
        fromPlayerId: null, // System message
        body: effect,
        isSystemMessage: true,
        metadata: { advantageType: advantage.advantageType, playerId },
      });
    }

    // Spawn new advantage in this camp
    await db.insert(advantages).values({
      seasonId: player.seasonId,
      tribeId: advantage.tribeId,
      advantageType: advantage.advantageType,
      hiddenLocation: `Hidden near camp (spawned after advantage played)`,
    });

    return NextResponse.json({
      success: true,
      message: 'Advantage played successfully',
      effect,
    });
  } catch (error) {
    console.error('Play advantage error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
