import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { players, confessionals } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { ConfessionalRequestSchema } from '@castaway/schemas/src/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, body: confessionalBody, visibility } = ConfessionalRequestSchema.parse(body);

    // Verify player exists
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Create confessional
    const [confessional] = await db
      .insert(confessionals)
      .values({
        playerId,
        body: confessionalBody,
        visibility,
      })
      .returning();

    return NextResponse.json({
      id: confessional!.id,
      createdAt: confessional!.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Confessional error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
