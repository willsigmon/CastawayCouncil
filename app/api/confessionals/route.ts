import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { confessionals, confessionalInsights, players } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import {
  analyzeConfessional,
  calculateTotalInsightPoints,
  getConfessionalRewards,
  getConfessionalPrompts,
} from '@game-logic';

const CreateConfessionalSchema = z.object({
  playerId: z.string().uuid(),
  body: z.string().min(10, 'Confessional must be at least 10 characters'),
  visibility: z.enum(['private', 'postseason']).default('private'),
});

/**
 * GET /api/confessionals
 * Get player's confessionals and insight points
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const includeRewards = searchParams.get('rewards') === 'true';
    const includePrompts = searchParams.get('prompts') === 'true';

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

    // Get all confessionals
    const playerConfessionals = await db.query.confessionals.findMany({
      where: eq(confessionals.playerId, playerId),
      with: {
        insights: true,
      },
      orderBy: [desc(confessionals.createdAt)],
    });

    // Calculate total insight points
    const allInsights = playerConfessionals.flatMap((c) => c.insights);
    const insightSummary = calculateTotalInsightPoints(
      allInsights.map((i) => ({
        confessionalId: i.confessionalId,
        playerId: i.playerId,
        insightPoints: i.insightPoints,
        category: i.category as any,
        reason: '',
      }))
    );

    const response: any = {
      confessionals: playerConfessionals.map((c) => ({
        id: c.id,
        body: c.body,
        visibility: c.visibility,
        createdAt: c.createdAt,
        insights: c.insights.map((i) => ({
          points: i.insightPoints,
          category: i.category,
        })),
      })),
      insightSummary,
    };

    // Include rewards if requested
    if (includeRewards) {
      response.rewards = getConfessionalRewards(insightSummary.total);
    }

    // Include prompts if requested
    if (includePrompts) {
      // Get context for prompts
      const season = await db.query.seasons.findFirst({
        where: eq(players.seasonId, player.seasonId),
      });

      const playerStats = await db.query.stats.findFirst({
        where: and(
          eq(players.id, playerId),
          eq(players.seasonId, player.seasonId)
        ),
        orderBy: [desc(players.createdAt)],
        limit: 1,
      });

      const lowStats =
        playerStats && (playerStats.energy < 50 || playerStats.hunger < 50);

      response.prompts = getConfessionalPrompts({
        day: season?.dayIndex || 1,
        hasAlliance: false, // TODO: Check for alliances
        lowStats: lowStats || false,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch confessionals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch confessionals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/confessionals
 * Create a new confessional and award insight points
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, body: confessionalBody, visibility } =
      CreateConfessionalSchema.parse(body);

    // Get player
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Create confessional
    const newConfessional = await db
      .insert(confessionals)
      .values({
        playerId,
        body: confessionalBody,
        visibility,
      })
      .returning();

    const confessional = newConfessional[0]!;

    // Analyze confessional for insight points
    const insight = analyzeConfessional({
      playerId,
      body: confessionalBody,
      visibility,
    });

    // Create insight record
    await db.insert(confessionalInsights).values({
      confessionalId: confessional.id,
      playerId,
      insightPoints: insight.insightPoints,
      category: insight.category,
    });

    // Get updated insight totals
    const allInsights = await db.query.confessionalInsights.findMany({
      where: eq(confessionalInsights.playerId, playerId),
    });

    const insightSummary = calculateTotalInsightPoints(
      allInsights.map((i) => ({
        confessionalId: i.confessionalId,
        playerId: i.playerId,
        insightPoints: i.insightPoints,
        category: i.category as any,
        reason: '',
      }))
    );

    // Check for new rewards
    const rewards = getConfessionalRewards(insightSummary.total);
    const newRewards = rewards.filter((r) => {
      const previousTotal = insightSummary.total - insight.insightPoints;
      return r.unlocked && previousTotal < r.threshold;
    });

    return NextResponse.json({
      confessional: {
        id: confessional.id,
        body: confessional.body,
        visibility: confessional.visibility,
        createdAt: confessional.createdAt,
      },
      insight: {
        points: insight.insightPoints,
        category: insight.category,
        reason: insight.reason,
      },
      insightSummary,
      newRewards: newRewards.length > 0 ? newRewards : undefined,
    });
  } catch (error) {
    console.error('Failed to create confessional:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create confessional' },
      { status: 500 }
    );
  }
}
