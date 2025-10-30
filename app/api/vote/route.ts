import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { players, votes, events } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { VoteRequestSchema } from '@castaway/schemas/src/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voterId, targetPlayerId, day } = VoteRequestSchema.parse(body);

    // Verify voter exists and is not eliminated
    const voter = await db.query.players.findFirst({
      where: eq(players.id, voterId),
      with: { season: true },
    });

    if (!voter || voter.eliminatedAt) {
      return NextResponse.json({ error: 'Voter not found or eliminated' }, { status: 404 });
    }

    // Verify target exists
    const target = await db.query.players.findFirst({
      where: eq(players.id, targetPlayerId),
    });

    if (!target) {
      return NextResponse.json({ error: 'Target player not found' }, { status: 404 });
    }

    // Check if voting phase is active
    const votingPhaseEvent = await db.query.events.findFirst({
      where: and(
        eq(events.seasonId, voter.seasonId),
        eq(events.day, day),
        eq(events.kind, 'phase_open')
      ),
      orderBy: (events, { desc }) => [desc(events.createdAt)],
    });

    if (!votingPhaseEvent) {
      return NextResponse.json({ error: 'Voting phase not active' }, { status: 403 });
    }

    // Check if player has already voted (allow vote changes)
    const existingVote = await db.query.votes.findFirst({
      where: and(
        eq(votes.seasonId, voter.seasonId),
        eq(votes.day, day),
        eq(votes.voterPlayerId, voterId)
      ),
    });

    let voteId: string;

    if (existingVote) {
      // Update existing vote
      await db
        .update(votes)
        .set({ targetPlayerId })
        .where(eq(votes.id, existingVote.id));
      voteId = existingVote.id;
    } else {
      // Create new vote
      const [newVote] = await db
        .insert(votes)
        .values({
          seasonId: voter.seasonId,
          day,
          voterPlayerId: voterId,
          targetPlayerId,
          idolPlayed: false,
        })
        .returning();
      voteId = newVote!.id;
    }

    return NextResponse.json({
      success: true,
      voteId,
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
