import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { weatherEvents, seasons, campUpgrades } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const WeatherQuerySchema = z.object({
  seasonId: z.string().uuid(),
  day: z.coerce.number().int().min(1).optional(),
});

/**
 * GET /api/weather
 * Get current weather for a season/day
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = WeatherQuerySchema.parse({
      seasonId: searchParams.get('seasonId'),
      day: searchParams.get('day'),
    });

    // Get current season info
    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, params.seasonId),
    });

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    // Use provided day or current day index
    const day = params.day ?? season.dayIndex;

    // Get weather for this day
    const weather = await db.query.weatherEvents.findFirst({
      where: and(
        eq(weatherEvents.seasonId, params.seasonId),
        eq(weatherEvents.day, day)
      ),
    });

    if (!weather) {
      return NextResponse.json({
        weatherType: 'sunny',
        severity: 1,
        description: 'Clear skies and pleasant weather.',
        hungerModifier: 0,
        thirstModifier: 0,
        comfortModifier: 0,
        warning: null,
      });
    }

    // Get weather warning if severe
    let warning: string | null = null;
    if (weather.severity === 3) {
      switch (weather.weatherType) {
        case 'storm':
          warning = '⚠️ SEVERE STORM WARNING: Build shelter and secure supplies!';
          break;
        case 'heat':
          warning = '🌡️ EXTREME HEAT WARNING: Gather water immediately!';
          break;
        case 'cold':
          warning = '❄️ FREEZE WARNING: Build fire and find shelter!';
          break;
        case 'rain':
          warning = '🌧️ HEAVY RAIN WARNING: Seek shelter to stay dry!';
          break;
      }
    }

    return NextResponse.json({
      weatherType: weather.weatherType,
      severity: weather.severity,
      description: weather.description,
      hungerModifier: weather.hungerModifier,
      thirstModifier: weather.thirstModifier,
      comfortModifier: weather.comfortModifier,
      warning,
      day,
    });
  } catch (error) {
    console.error('Failed to fetch weather:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}
