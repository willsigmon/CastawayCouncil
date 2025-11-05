import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { craftingRecipes, craftingLog, inventory, players, campUpgrades } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { craftItem, getAvailableRecipes } from '@game-logic';

const CraftSchema = z.object({
  playerId: z.string().uuid(),
  recipeId: z.string(),
});

/**
 * POST /api/crafting
 * Craft an item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, recipeId } = CraftSchema.parse(body);

    // Get player
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

    // Check if tool station is built
    const toolStation = await db.query.campUpgrades.findFirst({
      where: and(
        eq(campUpgrades.tribeId, tribeData.id),
        eq(campUpgrades.upgradeType, 'tool_station')
      ),
    });

    if (!toolStation) {
      return NextResponse.json(
        { error: 'Tool station required for crafting. Build one first!' },
        { status: 400 }
      );
    }

    // Get recipe from database
    const recipe = await db.query.craftingRecipes.findFirst({
      where: eq(craftingRecipes.id, recipeId),
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Get player inventory
    const playerInventoryItems = await db.query.inventory.findMany({
      where: and(
        eq(inventory.ownerId, playerId),
        eq(inventory.inventoryType, 'personal')
      ),
    });

    // Get tribe inventory
    const tribeInventoryItems = await db.query.inventory.findMany({
      where: and(
        eq(inventory.ownerId, tribeData.id),
        eq(inventory.inventoryType, 'tribe')
      ),
    });

    // Convert to simple objects
    const playerInv: Record<string, number> = {};
    for (const item of playerInventoryItems) {
      playerInv[item.itemName] = (playerInv[item.itemName] || 0) + item.quantity;
    }

    const tribeInv: Record<string, number> = {};
    for (const item of tribeInventoryItems) {
      tribeInv[item.itemName] = (tribeInv[item.itemName] || 0) + item.quantity;
    }

    // Try to craft
    const craftingRecipeData = {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      ingredients: recipe.ingredients as Array<{ item: string; quantity: number }>,
      resultItem: recipe.resultItem,
      resultQuantity: recipe.resultQuantity,
      unlockCondition: recipe.unlockCondition || undefined,
    };

    const result = craftItem(craftingRecipeData, playerInv, tribeInv);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Deduct ingredients from inventories
    for (const ingredient of result.ingredientsUsed!) {
      let remaining = ingredient.quantity;

      // Try player inventory first
      const playerItems = playerInventoryItems.filter(
        (i) => i.itemName === ingredient.item
      );
      for (const item of playerItems) {
        if (remaining <= 0) break;
        if (item.quantity <= remaining) {
          await db.delete(inventory).where(eq(inventory.id, item.id));
          remaining -= item.quantity;
        } else {
          await db
            .update(inventory)
            .set({ quantity: item.quantity - remaining })
            .where(eq(inventory.id, item.id));
          remaining = 0;
        }
      }

      // Then try tribe inventory
      if (remaining > 0) {
        const tribeItems = tribeInventoryItems.filter(
          (i) => i.itemName === ingredient.item
        );
        for (const item of tribeItems) {
          if (remaining <= 0) break;
          if (item.quantity <= remaining) {
            await db.delete(inventory).where(eq(inventory.id, item.id));
            remaining -= item.quantity;
          } else {
            await db
              .update(inventory)
              .set({ quantity: item.quantity - remaining })
              .where(eq(inventory.id, item.id));
            remaining = 0;
          }
        }
      }
    }

    // Add result item to player inventory
    const existingResult = await db.query.inventory.findFirst({
      where: and(
        eq(inventory.ownerId, playerId),
        eq(inventory.inventoryType, 'personal'),
        eq(inventory.itemName, result.resultItem!)
      ),
    });

    if (existingResult) {
      await db
        .update(inventory)
        .set({ quantity: existingResult.quantity + result.resultQuantity! })
        .where(eq(inventory.id, existingResult.id));
    } else {
      await db.insert(inventory).values({
        seasonId: player.seasonId,
        inventoryType: 'personal',
        ownerId: playerId,
        itemType: 'tool',
        itemName: result.resultItem!,
        quantity: result.resultQuantity!,
      });
    }

    // Log crafting
    await db.insert(craftingLog).values({
      playerId,
      recipeId,
    });

    return NextResponse.json({
      message: result.message,
      craftedItem: result.resultItem,
      quantity: result.resultQuantity,
      ingredientsUsed: result.ingredientsUsed,
    });
  } catch (error) {
    console.error('Failed to craft item:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to craft item' }, { status: 500 });
  }
}

/**
 * GET /api/crafting
 * Get available recipes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    // Get player
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

    // Get tribe upgrades to determine unlocked conditions
    const upgrades = tribeData
      ? await db.query.campUpgrades.findMany({
          where: eq(campUpgrades.tribeId, tribeData.id),
        })
      : [];

    const unlockedConditions: string[] = [];
    for (const upgrade of upgrades) {
      unlockedConditions.push(`${upgrade.upgradeType}_level_${upgrade.level}`);
    }

    // Get available recipes
    const allRecipes = await db.query.craftingRecipes.findMany();
    const availableRecipes = allRecipes.filter((recipe) => {
      if (!recipe.unlockCondition) return true;
      return unlockedConditions.includes(recipe.unlockCondition);
    });

    return NextResponse.json({
      recipes: availableRecipes,
      unlockedConditions,
    });
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
