import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { challenges, challengeSubmissions, players, messages } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  submitBuildingHeight,
  submitPuzzleGuess,
  type TowerOfTenState,
} from '@castaway/game-logic/src/challenges/tower-of-ten';

const TowerSubmitSchema = z.object({
  playerId: z.string().uuid(),
  challengeId: z.string().uuid(),
  submissionType: z.enum(['building', 'puzzle']),
  // For building: height (1-5)
  height: z.number().int().min(1).max(5).optional(),
  // For puzzle: emoji array
  guess: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, challengeId, submissionType, height, guess } =
      TowerSubmitSchema.parse(body);

    // Get player with tribe
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
      with: {
        tribeMembers: { with: { tribe: true } },
      },
    });

    if (!player || player.eliminatedAt) {
      return NextResponse.json({ error: 'Player not found or eliminated' }, { status: 404 });
    }

    const tribeId = player.tribeMembers[0]?.tribe.id;
    if (!tribeId) {
      return NextResponse.json({ error: 'Player not in a tribe' }, { status: 400 });
    }

    // Get challenge
    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId),
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.challengeName !== 'Tower of Ten') {
      return NextResponse.json(
        { error: 'This API is for Tower of Ten challenges only' },
        { status: 400 }
      );
    }

    if (challenge.scoredAt) {
      return NextResponse.json({ error: 'Challenge already completed' }, { status: 400 });
    }

    // Get current state
    let state = challenge.stateJson as TowerOfTenState;

    // Process submission
    let result: any;

    if (submissionType === 'building') {
      if (!height) {
        return NextResponse.json({ error: 'Height required for building' }, { status: 400 });
      }
      result = submitBuildingHeight(state, tribeId, height);
      state = result.newState;

      // Post to challenge chat
      await db.insert(messages).values({
        seasonId: challenge.seasonId,
        channelType: 'challenge',
        fromPlayerId: playerId,
        body: `${player.displayName} submitted ${height} feet for their tribe`,
        isSystemMessage: false,
        metadata: { tribeId, height },
      });
    } else if (submissionType === 'puzzle') {
      if (!guess || guess.length === 0) {
        return NextResponse.json({ error: 'Guess required for puzzle' }, { status: 400 });
      }
      result = submitPuzzleGuess(state, tribeId, guess);
      state = result.newState;

      // Post to challenge chat
      await db.insert(messages).values({
        seasonId: challenge.seasonId,
        channelType: 'challenge',
        fromPlayerId: playerId,
        body: `${player.displayName} submitted a puzzle guess: ${guess.join('')} - ${result.feedback}`,
        isSystemMessage: false,
        metadata: { tribeId, guess, feedback: result.feedback },
      });
    }

    // Save submission
    await db.insert(challengeSubmissions).values({
      challengeId,
      subjectType: 'tribe',
      subjectId: tribeId,
      submissionData: { type: submissionType, height, guess },
    });

    // Update challenge state
    await db
      .update(challenges)
      .set({
        stateJson: state,
        scoredAt: state.phase === 'complete' ? new Date() : null,
      })
      .where(eq(challenges.id, challengeId));

    return NextResponse.json({
      success: result.success,
      message: result.message,
      feedback: result.feedback || null,
      state: {
        phase: state.phase,
        tribeHeight: state.tribeHeights[tribeId],
        turns: state.turns[tribeId],
      },
    });
  } catch (error) {
    console.error('Tower challenge submit error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
