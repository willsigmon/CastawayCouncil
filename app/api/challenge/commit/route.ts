import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { challenges, players } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { ChallengeCommitRequestSchema } from '@castaway/schemas/src/api';

// Store player commitments (in real app, use database table)
const commitments = new Map<string, { playerId: string; clientSeedHash: string }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, challengeId, clientSeedHash } = ChallengeCommitRequestSchema.parse(body);

    // Verify player exists
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
    });

    if (!player || player.eliminatedAt) {
      return NextResponse.json(
        { error: 'Player not found or eliminated' },
        { status: 404 }
      );
    }

    // Verify challenge exists and is not scored
    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId),
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.scoredAt) {
      return NextResponse.json(
        { error: 'Challenge already scored' },
        { status: 400 }
      );
    }

    // Validate hash format (64 hex characters)
    if (!/^[a-f0-9]{64}$/i.test(clientSeedHash)) {
      return NextResponse.json(
        { error: 'Invalid hash format' },
        { status: 400 }
      );
    }

    // Store commitment
    const key = `${challengeId}:${playerId}`;
    commitments.set(key, { playerId, clientSeedHash });

    console.log(`Player ${playerId} committed seed hash for challenge ${challengeId}`);

    return NextResponse.json({
      success: true,
      message: 'Seed commitment recorded',
    });
  } catch (error) {
    console.error('Challenge commit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export commitments for scoring (in real app, this would be in database)
export function getCommitments() {
  return commitments;
}
