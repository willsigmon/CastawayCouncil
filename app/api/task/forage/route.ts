import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { players, stats, items } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { ForageRequestSchema, ForageResponseSchema } from '@castaway/schemas/src/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId } = ForageRequestSchema.parse(body);

    // Get player and current season
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
      with: {
        season: true,
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Check if player is eliminated
    if (player.eliminatedAt) {
      return NextResponse.json({ error: 'Player is eliminated' }, { status: 403 });
    }

    const currentDay = player.season.dayIndex;

    // Get current stats
    const currentStats = await db.query.stats.findFirst({
      where: and(eq(stats.playerId, playerId), eq(stats.day, currentDay)),
    });

    if (!currentStats) {
      return NextResponse.json({ error: 'Stats not found for current day' }, { status: 404 });
    }

    // Calculate forage outcome
    const hungerGain = Math.floor(Math.random() * 15) + 10; // 10-25 hunger restored
    const energyCost = -5; // Costs 5 energy

    // Small chance (5%) to find an item
    const foundItem = Math.random() < 0.05;
    let item = undefined;

    if (foundItem) {
      // Find a hidden idol
      const hiddenIdol = await db.query.items.findFirst({
        where: and(
          eq(items.seasonId, player.seasonId),
          eq(items.type, 'idol'),
          eq(items.ownerPlayerId, null) // Not owned yet
        ),
      });

      if (hiddenIdol) {
        // Claim the idol
        await db
          .update(items)
          .set({ ownerPlayerId: playerId })
          .where(eq(items.id, hiddenIdol.id));

        item = {
          id: hiddenIdol.id,
          type: hiddenIdol.type as 'idol' | 'tool' | 'event',
        };
      }
    }

    // Update stats
    await db
      .update(stats)
      .set({
        hunger: Math.min(100, currentStats.hunger + hungerGain),
        energy: Math.max(0, currentStats.energy + energyCost),
      })
      .where(and(eq(stats.playerId, playerId), eq(stats.day, currentDay)));

    const response: ForageResponseSchema = {
      delta: {
        hunger: hungerGain,
        energy: energyCost,
      },
      item,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Forage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
