import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { players, stats } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { HelpRequestSchema } from '@castaway/schemas/src/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, targetPlayerId } = HelpRequestSchema.parse(body);

    // Verify both players exist and are not eliminated
    const [player, targetPlayer] = await Promise.all([
      db.query.players.findFirst({
        where: eq(players.id, playerId),
        with: { season: true },
      }),
      db.query.players.findFirst({
        where: eq(players.id, targetPlayerId),
        with: { season: true },
      }),
    ]);

    if (!player || player.eliminatedAt) {
      return NextResponse.json({ error: 'Player not found or eliminated' }, { status: 404 });
    }

    if (!targetPlayer || targetPlayer.eliminatedAt) {
      return NextResponse.json({ error: 'Target player not found or eliminated' }, { status: 404 });
    }

    // Must be same season
    if (player.seasonId !== targetPlayer.seasonId) {
      return NextResponse.json({ error: 'Players not in same season' }, { status: 400 });
    }

    const currentDay = player.season.dayIndex;

    // Get target's current stats
    const targetStats = await db.query.stats.findFirst({
      where: and(eq(stats.playerId, targetPlayerId), eq(stats.day, currentDay)),
    });

    if (!targetStats) {
      return NextResponse.json({ error: 'Target stats not found' }, { status: 404 });
    }

    // Helping increases target's social by 5-10
    const socialGain = Math.floor(Math.random() * 6) + 5;

    await db
      .update(stats)
      .set({
        social: Math.min(100, targetStats.social + socialGain),
      })
      .where(and(eq(stats.playerId, targetPlayerId), eq(stats.day, currentDay)));

    return NextResponse.json({
      targetPlayerId,
      delta: { social: socialGain },
    });
  } catch (error) {
    console.error('Help error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
