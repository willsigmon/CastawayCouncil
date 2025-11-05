import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { rumors, players, seasons } from '@/drizzle/schema';
import { eq, and, gte, or } from 'drizzle-orm';
import { isRumorVisibleToPlayer, getRumorImpact } from '@game-logic';

/**
 * GET /api/rumors
 * Get rumors visible to player
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const seasonId = searchParams.get('seasonId');

    if (!seasonId) {
      return NextResponse.json({ error: 'seasonId required' }, { status: 400 });
    }

    // Get player if specified
    let playerTribeId: string | undefined;
    if (playerId) {
      const player = await db.query.players.findFirst({
        where: eq(players.id, playerId),
        with: {
          tribeMembers: {
            with: {
              tribe: true,
            },
          },
        },
      });

      if (player) {
        playerTribeId = player.tribeMembers[0]?.tribe?.id;
      }
    }

    // Get all active rumors
    const now = new Date();
    const allRumors = await db.query.rumors.findMany({
      where: and(
        eq(rumors.seasonId, seasonId),
        or(eq(rumors.expiresAt, null), gte(rumors.expiresAt, now))
      ),
      with: {
        targetPlayer: {
          with: {
            user: true,
          },
        },
      },
    });

    // Filter by visibility
    const visibleRumors = allRumors.filter((rumor) => {
      if (!playerId) return rumor.visibleTo === 'all';

      return isRumorVisibleToPlayer(
        {
          id: rumor.id,
          content: rumor.content,
          truthful: rumor.truthful,
          targetPlayerId: rumor.targetPlayerId || undefined,
          visibleTo: rumor.visibleTo,
          day: rumor.day,
          expiresInDays: rumor.expiresAt
            ? Math.ceil((rumor.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 7,
          impact: 'medium',
        },
        playerId,
        playerTribeId
      );
    });

    // Process rumors (hide truthfulness from players!)
    const processedRumors = visibleRumors.map((rumor) => ({
      id: rumor.id,
      content: rumor.content,
      targetPlayer: rumor.targetPlayer
        ? {
            id: rumor.targetPlayer.id,
            name: rumor.targetPlayer.displayName,
          }
        : null,
      day: rumor.day,
      expiresAt: rumor.expiresAt,
      visibleTo: rumor.visibleTo,
      // Don't send truthful flag to client - that's meta knowledge!
    }));

    return NextResponse.json({
      rumors: processedRumors,
      count: processedRumors.length,
    });
  } catch (error) {
    console.error('Failed to fetch rumors:', error);
    return NextResponse.json({ error: 'Failed to fetch rumors' }, { status: 500 });
  }
}
