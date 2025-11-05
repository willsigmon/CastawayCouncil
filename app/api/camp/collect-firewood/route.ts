import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { players, stats, inventory, messages } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { collectFirewood } from '@castaway/game-logic/src/camp-actions';

const ActionSchema = z.object({
  playerId: z.string().uuid(),
  seasonId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, seasonId } = ActionSchema.parse(body);

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

    const currentDay = player.season.dayIndex;

    // Get current stats
    const currentStats = await db.query.stats.findFirst({
      where: and(eq(stats.playerId, playerId), eq(stats.day, currentDay)),
    });

    if (!currentStats) {
      return NextResponse.json({ error: 'Stats not found' }, { status: 404 });
    }

    // Perform action
    const result = collectFirewood();

    // Update stats
    const newEnergy = Math.max(0, Math.min(100, currentStats.energy + (result.statChanges.energy || 0)));

    await db
      .update(stats)
      .set({
        energy: newEnergy,
        updatedAt: new Date(),
      })
      .where(and(eq(stats.playerId, playerId), eq(stats.day, currentDay)));

    // Add items to tribe inventory
    const tribeId = player.tribeMembers[0]?.tribe.id;
    if (result.items && tribeId) {
      for (const item of result.items) {
        // Check if item exists in inventory
        const existing = await db.query.inventory.findFirst({
          where: and(
            eq(inventory.ownerId, tribeId),
            eq(inventory.itemName, item.name),
            eq(inventory.inventoryType, 'tribe')
          ),
        });

        if (existing) {
          await db
            .update(inventory)
            .set({ quantity: existing.quantity + item.quantity })
            .where(eq(inventory.id, existing.id));
        } else {
          await db.insert(inventory).values({
            seasonId,
            inventoryType: 'tribe',
            ownerId: tribeId,
            itemType: item.type as any,
            itemName: item.name,
            quantity: item.quantity,
          });
        }
      }
    }

    // Post to action chat
    if (tribeId) {
      await db.insert(messages).values({
        seasonId,
        channelType: 'action',
        tribeId,
        fromPlayerId: playerId,
        body: `${player.displayName} ${result.actionLog}`,
        isSystemMessage: false,
        metadata: { action: 'collect_firewood', items: result.items },
      });
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      statChanges: result.statChanges,
      items: result.items,
      newEnergy,
    });
  } catch (error) {
    console.error('Collect firewood error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
