import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { players, stats, inventory, messages, advantages } from '@/drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import {
  collectFirewood,
  gatherCoconuts,
  spearFish,
  buildShelter,
  getWater,
  cookFood,
  rest,
  meditate,
  searchForAdvantages,
  calculateEnergy,
  needsMedicalEvac,
  type ActionResult,
} from '@castaway/game-logic/src/camp-actions';
import { calculateFindSuccessRate } from '@castaway/game-logic/src/classes';

const CampActionSchema = z.object({
  playerId: z.string().uuid(),
  action: z.enum([
    'collect_firewood',
    'gather_coconuts',
    'spear_fish',
    'build_shelter',
    'get_water',
    'cook_small',
    'cook_large',
    'rest',
    'meditate',
    'search_advantages',
  ]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, action } = CampActionSchema.parse(body);

    // Get player with all relationships
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

    const seasonId = player.seasonId;
    const currentDay = player.season.dayIndex;
    const tribeId = player.tribeMembers[0]?.tribe.id;

    // Get current stats
    const currentStats = await db.query.stats.findFirst({
      where: and(eq(stats.playerId, playerId), eq(stats.day, currentDay)),
    });

    if (!currentStats) {
      return NextResponse.json({ error: 'Stats not found' }, { status: 404 });
    }

    // Get tribe inventory
    const tribeInventory = tribeId
      ? await db.query.inventory.findMany({
          where: and(eq(inventory.ownerId, tribeId), eq(inventory.inventoryType, 'tribe')),
        })
      : [];

    // Helper to check if item exists
    const hasItem = (itemName: string) =>
      tribeInventory.some((item) => item.itemName === itemName && item.quantity > 0);

    // Helper to get item quantity
    const getQuantity = (itemName: string) =>
      tribeInventory.find((item) => item.itemName === itemName)?.quantity || 0;

    // Execute action
    let result: ActionResult;

    switch (action) {
      case 'collect_firewood':
        result = collectFirewood();
        break;

      case 'gather_coconuts':
        result = gatherCoconuts();
        break;

      case 'spear_fish':
        const hasSpear = hasItem('Basic Spear');
        const hasFishingGear = hasItem('Fishing Gear');
        const findBonus = calculateFindSuccessRate(0, player.playerClass, player.wildcardAbility || undefined);
        result = spearFish(hasSpear, hasFishingGear, findBonus);
        break;

      case 'build_shelter':
        const hasFirewood = hasItem('Firewood') && getQuantity('Firewood') > 0;
        result = buildShelter(hasFirewood);
        // Consume firewood if successful
        if (result.success && tribeId) {
          const firewoodItem = tribeInventory.find((i) => i.itemName === 'Firewood');
          if (firewoodItem) {
            await db
              .update(inventory)
              .set({ quantity: Math.max(0, firewoodItem.quantity - 1) })
              .where(eq(inventory.id, firewoodItem.id));
          }
        }
        break;

      case 'get_water':
        result = getWater();
        break;

      case 'cook_small':
      case 'cook_large':
        const mealSize = action === 'cook_large' ? 'large' : 'small';
        const hasFirewoodForCooking = hasItem('Firewood') && getQuantity('Firewood') > 0;
        result = cookFood(mealSize, hasFirewoodForCooking);
        // Consume resources if successful
        if (result.success && tribeId) {
          const firewoodItem = tribeInventory.find((i) => i.itemName === 'Firewood');
          if (firewoodItem) {
            await db
              .update(inventory)
              .set({ quantity: Math.max(0, firewoodItem.quantity - 1) })
              .where(eq(inventory.id, firewoodItem.id));
          }
        }
        break;

      case 'rest':
        const hasBlanket = hasItem('Blanket');
        result = rest(hasBlanket);
        break;

      case 'meditate':
        result = meditate();
        break;

      case 'search_advantages':
        // Count hidden advantages in this camp
        const hiddenAdvantages = tribeId
          ? await db.query.advantages.findMany({
              where: and(
                eq(advantages.tribeId, tribeId),
                isNull(advantages.foundByPlayerId),
                isNull(advantages.playedAt)
              ),
            })
          : [];

        const classBonus = calculateFindSuccessRate(0, player.playerClass, player.wildcardAbility || undefined);
        result = searchForAdvantages(hiddenAdvantages.length, classBonus);

        // If found, assign to player
        if (result.success && result.items && hiddenAdvantages.length > 0) {
          const advantage = hiddenAdvantages[0]!;
          await db
            .update(advantages)
            .set({ foundByPlayerId: playerId })
            .where(eq(advantages.id, advantage.id));

          // Add to personal inventory
          await db.insert(inventory).values({
            seasonId,
            inventoryType: 'personal',
            ownerId: playerId,
            itemType: 'advantage',
            itemName: advantage.advantageType,
            quantity: 1,
            metadata: { advantageId: advantage.id },
          });
        }
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Update stats
    const newHunger = Math.max(
      0,
      Math.min(100, currentStats.hunger + (result.statChanges.hunger || 0))
    );
    const newThirst = Math.max(
      0,
      Math.min(100, currentStats.thirst + (result.statChanges.thirst || 0))
    );
    const newComfort = Math.max(
      0,
      Math.min(100, currentStats.comfort + (result.statChanges.comfort || 0))
    );
    const newEnergy = result.statChanges.energy
      ? Math.max(0, Math.min(100, currentStats.energy + result.statChanges.energy))
      : calculateEnergy({ hunger: newHunger, thirst: newThirst, comfort: newComfort });

    const medicalAlert = needsMedicalEvac({
      hunger: newHunger,
      thirst: newThirst,
      comfort: newComfort,
      energy: newEnergy,
    });

    await db
      .update(stats)
      .set({
        hunger: newHunger,
        thirst: newThirst,
        comfort: newComfort,
        energy: newEnergy,
        medicalAlert,
        updatedAt: new Date(),
      })
      .where(and(eq(stats.playerId, playerId), eq(stats.day, currentDay)));

    // Add items to inventory
    if (result.items && result.success) {
      for (const item of result.items) {
        if (item.type === 'advantage') continue; // Already handled above

        const inventoryType = ['food', 'material', 'tool'].includes(item.type) ? 'tribe' : 'personal';
        const ownerId = inventoryType === 'tribe' ? tribeId! : playerId;

        const existing = await db.query.inventory.findFirst({
          where: and(
            eq(inventory.ownerId, ownerId),
            eq(inventory.itemName, item.name),
            eq(inventory.inventoryType, inventoryType)
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
            inventoryType,
            ownerId,
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
        metadata: { action, items: result.items, statChanges: result.statChanges },
      });
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      statChanges: result.statChanges,
      items: result.items,
      newStats: {
        hunger: newHunger,
        thirst: newThirst,
        comfort: newComfort,
        energy: newEnergy,
        medicalAlert,
      },
    });
  } catch (error) {
    console.error('Camp action error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
