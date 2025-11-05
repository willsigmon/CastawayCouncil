import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { secretMissions, players, playerRelationships } from '@/drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';
import { z } from 'zod';
import { checkMissionProgress, calculateMissionRewards } from '@game-logic';

const CheckMissionSchema = z.object({
  missionId: z.string().uuid(),
  actions: z.object({
    votedFor: z.string().uuid().optional(),
    alliedWith: z.array(z.string().uuid()).optional(),
    gatheredResources: z.record(z.number()).optional(),
    foundAdvantage: z.boolean().optional(),
    builtUpgrade: z.string().optional(),
    helpedPlayers: z.array(z.string().uuid()).optional(),
    challengeWon: z.boolean().optional(),
    encounteredPlayers: z.array(z.string().uuid()).optional(),
  }),
  keptSecret: z.boolean().default(true),
});

/**
 * GET /api/missions
 * Get player's active missions
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
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get active missions
    const now = new Date();
    const missions = await db.query.secretMissions.findMany({
      where: and(
        eq(secretMissions.playerId, playerId),
        gte(secretMissions.expiresAt, now)
      ),
    });

    // Filter for non-expired, non-completed
    const activeMissions = missions.filter(
      (m) => m.status === 'assigned' || m.status === 'in_progress'
    );

    return NextResponse.json({
      missions: activeMissions.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        objective: m.objective,
        reward: m.reward,
        status: m.status,
        expiresAt: m.expiresAt,
        day: m.day,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch missions:', error);
    return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
  }
}

/**
 * POST /api/missions
 * Check mission progress and complete if done
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { missionId, actions, keptSecret } = CheckMissionSchema.parse(body);

    // Get mission
    const mission = await db.query.secretMissions.findFirst({
      where: eq(secretMissions.id, missionId),
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Check if expired
    if (mission.expiresAt < new Date()) {
      await db
        .update(secretMissions)
        .set({ status: 'expired' })
        .where(eq(secretMissions.id, missionId));

      return NextResponse.json({ error: 'Mission expired' }, { status: 400 });
    }

    // Check progress
    const missionData = {
      id: mission.id,
      playerId: mission.playerId,
      title: mission.title,
      description: mission.description,
      objective: mission.objective as any,
      reward: mission.reward as any,
      status: mission.status,
      expiresInDays: Math.ceil(
        (mission.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    };

    const progress = checkMissionProgress(missionData, actions);

    if (progress.completed) {
      // Complete mission
      await db
        .update(secretMissions)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(secretMissions.id, missionId));

      // Calculate rewards
      const rewards = calculateMissionRewards(missionData, keptSecret);

      return NextResponse.json({
        completed: true,
        progress: 100,
        message: progress.message,
        rewards,
        secretBonus: keptSecret,
      });
    } else {
      // Update to in_progress
      if (mission.status === 'assigned') {
        await db
          .update(secretMissions)
          .set({ status: 'in_progress' })
          .where(eq(secretMissions.id, missionId));
      }

      return NextResponse.json({
        completed: false,
        progress: progress.progress,
        message: progress.message,
      });
    }
  } catch (error) {
    console.error('Failed to check mission:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to check mission' }, { status: 500 });
  }
}
