import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { players, stats } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { RestRequestSchema } from '@castaway/schemas/src/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId } = RestRequestSchema.parse(body);

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

    // Resting restores 20-30 energy
    const energyGain = Math.floor(Math.random() * 11) + 20;

    await db
      .update(stats)
      .set({
        energy: Math.min(100, currentStats.energy + energyGain),
      })
      .where(and(eq(stats.playerId, playerId), eq(stats.day, currentDay)));

    return NextResponse.json({
      delta: { energy: energyGain },
    });
  } catch (error) {
    console.error('Rest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
