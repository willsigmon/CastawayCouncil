import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { seasons } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const UpdateSettingsSchema = z.object({
  totalDays: z.number().int().min(5).max(30).optional(),
  mergeAt: z.number().int().min(4).max(20).optional(),
  fastForwardMode: z.boolean().optional(),
  statDecayMultiplier: z.number().min(0.1).max(3.0).optional(),
  advantageSpawnRate: z.number().min(0.0).max(5.0).optional(),
  weatherIntensity: z.number().min(0.1).max(3.0).optional(),
  randomEventChance: z.number().min(0.0).max(3.0).optional(),
});

/**
 * GET /api/seasons/[seasonId]/settings
 * Get season settings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { seasonId: string } }
) {
  try {
    const { seasonId } = params;

    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, seasonId),
    });

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: {
        totalDays: season.totalDays,
        mergeAt: season.mergeAt,
        fastForwardMode: season.fastForwardMode,
        statDecayMultiplier: season.statDecayMultiplier,
        advantageSpawnRate: season.advantageSpawnRate,
        weatherIntensity: season.weatherIntensity,
        randomEventChance: season.randomEventChance,
      },
    });
  } catch (error) {
    console.error('Failed to fetch season settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/seasons/[seasonId]/settings
 * Update season settings (only before season starts)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { seasonId: string } }
) {
  try {
    const { seasonId } = params;

    // Get season
    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, seasonId),
    });

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    // Only allow updates if season hasn't started
    if (season.status !== 'planned') {
      return NextResponse.json(
        { error: 'Cannot update settings after season has started' },
        { status: 400 }
      );
    }

    // Parse and validate updates
    const body = await request.json();
    const updates = UpdateSettingsSchema.parse(body);

    // Validate merge timing makes sense
    if (updates.mergeAt !== undefined && updates.totalDays !== undefined) {
      if (updates.mergeAt >= updates.totalDays) {
        return NextResponse.json(
          { error: 'Merge must occur before final day' },
          { status: 400 }
        );
      }
    }

    // Update settings
    await db.update(seasons).set(updates).where(eq(seasons.id, seasonId));

    // Fetch updated season
    const updatedSeason = await db.query.seasons.findFirst({
      where: eq(seasons.id, seasonId),
    });

    return NextResponse.json({
      settings: {
        totalDays: updatedSeason!.totalDays,
        mergeAt: updatedSeason!.mergeAt,
        fastForwardMode: updatedSeason!.fastForwardMode,
        statDecayMultiplier: updatedSeason!.statDecayMultiplier,
        advantageSpawnRate: updatedSeason!.advantageSpawnRate,
        weatherIntensity: updatedSeason!.weatherIntensity,
        randomEventChance: updatedSeason!.randomEventChance,
      },
    });
  } catch (error) {
    console.error('Failed to update season settings:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid settings', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
