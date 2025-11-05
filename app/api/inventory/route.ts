import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { inventory, players } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get('playerId');
    const tribeId = searchParams.get('tribeId');

    if (!playerId && !tribeId) {
      return NextResponse.json({ error: 'playerId or tribeId required' }, { status: 400 });
    }

    let personalInventory: any[] = [];
    let tribeInventory: any[] = [];

    if (playerId) {
      // Get player's personal inventory
      personalInventory = await db.query.inventory.findMany({
        where: and(eq(inventory.ownerId, playerId), eq(inventory.inventoryType, 'personal')),
      });
    }

    if (tribeId) {
      // Get tribe's inventory
      tribeInventory = await db.query.inventory.findMany({
        where: and(eq(inventory.ownerId, tribeId), eq(inventory.inventoryType, 'tribe')),
      });
    }

    // If only playerId provided, also get their tribe inventory
    if (playerId && !tribeId) {
      const player = await db.query.players.findFirst({
        where: eq(players.id, playerId),
        with: {
          tribeMembers: { with: { tribe: true } },
        },
      });

      const playerTribeId = player?.tribeMembers[0]?.tribe.id;
      if (playerTribeId) {
        tribeInventory = await db.query.inventory.findMany({
          where: and(
            eq(inventory.ownerId, playerTribeId),
            eq(inventory.inventoryType, 'tribe')
          ),
        });
      }
    }

    return NextResponse.json({
      personal: personalInventory,
      tribe: tribeInventory,
    });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
