import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { campUpgrades, inventory, players, tribeMembers, events, messages } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { buildUpgrade, upgradeDefinitions } from '@game-logic';

const BuildUpgradeSchema = z.object({
  playerId: z.string().uuid(),
  upgradeType: z.enum(['shelter', 'fire', 'trap', 'tool_station', 'water_filter', 'storage']),
});

/**
 * POST /api/camp/upgrade
 * Build a camp upgrade
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, upgradeType } = BuildUpgradeSchema.parse(body);

    // Get player and tribe
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

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const tribeData = player.tribeMembers[0]?.tribe;
    if (!tribeData) {
      return NextResponse.json({ error: 'Player not in a tribe' }, { status: 400 });
    }

    const tribeId = tribeData.id;

    // Get tribe inventory
    const tribeInventoryItems = await db.query.inventory.findMany({
      where: and(
        eq(inventory.ownerId, tribeId),
        eq(inventory.inventoryType, 'tribe')
      ),
    });

    // Convert to simple object
    const tribeInventory: Record<string, number> = {};
    for (const item of tribeInventoryItems) {
      tribeInventory[item.itemType] = (tribeInventory[item.itemType] || 0) + item.quantity;
    }

    // Get existing upgrades
    const existingUpgrades = await db.query.campUpgrades.findMany({
      where: and(
        eq(campUpgrades.tribeId, tribeId),
        eq(campUpgrades.upgradeType, upgradeType)
      ),
    });

    const currentLevel = existingUpgrades.length > 0
      ? Math.max(...existingUpgrades.map(u => u.level))
      : 0;

    // Try to build upgrade
    const result = buildUpgrade(tribeInventory, upgradeType, currentLevel);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Deduct resources from tribe inventory
    if (result.resourcesUsed) {
      for (const [resource, cost] of Object.entries(result.resourcesUsed)) {
        // Find inventory items with this resource type
        const items = tribeInventoryItems.filter(i => i.itemType === resource);
        let remaining = cost;

        for (const item of items) {
          if (remaining <= 0) break;

          if (item.quantity <= remaining) {
            // Delete this item entirely
            await db.delete(inventory).where(eq(inventory.id, item.id));
            remaining -= item.quantity;
          } else {
            // Reduce quantity
            await db.update(inventory)
              .set({ quantity: item.quantity - remaining })
              .where(eq(inventory.id, item.id));
            remaining = 0;
          }
        }
      }
    }

    // Create upgrade record
    const upgrade = await db.insert(campUpgrades).values({
      tribeId,
      upgradeType,
      level: result.upgrade!.level,
      resourceCost: result.resourcesUsed,
      benefits: result.upgrade!.benefits,
      builtBy: playerId,
    }).returning();

    // Log event
    await db.insert(events).values({
      seasonId: player.seasonId,
      day: 1, // TODO: Get actual day
      kind: 'camp_upgrade',
      payloadJson: {
        tribeId,
        upgradeType,
        level: result.upgrade!.level,
        builtBy: playerId,
      },
    });

    // Post to action chat
    const definition = upgradeDefinitions[upgradeType];
    await db.insert(messages).values({
      seasonId: player.seasonId,
      channelType: 'action',
      tribeId,
      fromPlayerId: playerId,
      body: `built ${definition.name} Level ${result.upgrade!.level}`,
      metadata: {
        action: 'build_upgrade',
        upgradeType,
        level: result.upgrade!.level,
        benefits: result.upgrade!.benefits,
      },
    });

    return NextResponse.json({
      message: result.message,
      upgrade: {
        id: upgrade[0]!.id,
        type: upgradeType,
        level: result.upgrade!.level,
        benefits: result.upgrade!.benefits,
      },
      resourcesUsed: result.resourcesUsed,
    });
  } catch (error) {
    console.error('Failed to build upgrade:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to build upgrade' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/camp/upgrade
 * Get tribe's camp upgrades
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tribeId = searchParams.get('tribeId');

    if (!tribeId) {
      return NextResponse.json({ error: 'tribeId required' }, { status: 400 });
    }

    const upgrades = await db.query.campUpgrades.findMany({
      where: eq(campUpgrades.tribeId, tribeId),
      with: {
        builder: {
          with: {
            user: true,
          },
        },
      },
    });

    // Group by type and get max level for each
    const upgradesByType: Record<string, any> = {};
    for (const upgrade of upgrades) {
      if (!upgradesByType[upgrade.upgradeType] ||
          upgrade.level > upgradesByType[upgrade.upgradeType].level) {
        upgradesByType[upgrade.upgradeType] = {
          type: upgrade.upgradeType,
          level: upgrade.level,
          benefits: upgrade.benefits,
          builtAt: upgrade.builtAt,
          builtBy: upgrade.builder?.displayName,
        };
      }
    }

    return NextResponse.json({
      upgrades: Object.values(upgradesByType),
    });
  } catch (error) {
    console.error('Failed to fetch upgrades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upgrades' },
      { status: 500 }
    );
  }
}
