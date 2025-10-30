import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { players, stats } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { WaterRequestSchema } from '@castaway/schemas/src/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId } = WaterRequestSchema.parse(body);

    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
      with: { season: true },
    });

    if (!player || player.eliminatedAt) {
      return NextResponse.json({ error: 'Player not found or eliminated' }, { status: 404 });
    }

    const currentDay = player.season.dayIndex;
    const currentStats = await db.query.stats.findFirst({
      where: and(eq(stats.playerId, playerId), eq(stats.day, currentDay)),
    });

    if (!currentStats) {
      return NextResponse.json({ error: 'Stats not found' }, { status: 404 });
    }

    // Calculate water outcome
    const thirstGain = Math.floor(Math.random() * 20) + 15; // 15-35 thirst restored

    // 10% chance of tainted water debuff
    const isTainted = Math.random() < 0.1;
    const debuff = isTainted ? 'tainted_water' : undefined;

    await db
      .update(stats)
      .set({
        thirst: Math.min(100, currentStats.thirst + thirstGain),
      })
      .where(and(eq(stats.playerId, playerId), eq(stats.day, currentDay)));

    return NextResponse.json({
      delta: { thirst: thirstGain },
      debuff,
    });
  } catch (error) {
    console.error('Water error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
