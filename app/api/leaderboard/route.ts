import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { careerStats, users } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import {
  rankPlayers,
  calculateDerivedStats,
  getPlayerTier,
  getAchievements,
  calculatePercentile,
} from '@game-logic';

/**
 * GET /api/leaderboard
 * Get global leaderboard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stat = searchParams.get('stat') || 'wins';
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId'); // Optional: get specific user's position

    // Get all career stats with user info
    const allStats = await db.query.careerStats.findMany({
      with: {
        user: true,
      },
      orderBy: [desc(careerStats.wins)],
    });

    if (allStats.length === 0) {
      return NextResponse.json({
        leaderboard: [],
        userPosition: null,
      });
    }

    // Map to format expected by rankPlayers
    const playersWithStats = allStats.map((s) => ({
      userId: s.userId,
      userName: s.user.handle,
      gamesPlayed: s.gamesPlayed,
      wins: s.wins,
      finalThree: s.finalThree,
      juryAppearances: s.juryAppearances,
      advantagesFound: s.advantagesFound,
      advantagesPlayed: s.advantagesPlayed,
      alliancesFormed: s.alliancesFormed,
      challengesWon: s.challengesWon,
      daysPlayed: s.daysPlayed,
      votesReceived: s.votesReceived,
      votesCast: s.votesCast,
      confessionalsMade: s.confessionalsMade,
      totalInsightPoints: s.totalInsightPoints,
    }));

    // Rank players by specified stat
    const validStats = [
      'wins',
      'winRate',
      'challengesWon',
      'advantagesFound',
      'totalInsightPoints',
      'daysPlayed',
    ] as const;
    const statToRankBy = validStats.includes(stat as any) ? (stat as any) : 'wins';

    const rankedPlayers = rankPlayers(playersWithStats, statToRankBy);

    // Limit results
    const topPlayers = rankedPlayers.slice(0, limit);

    // Format leaderboard
    const leaderboard = topPlayers.map((player) => {
      const derived = calculateDerivedStats(player.stats);
      const tier = getPlayerTier(player.stats);

      return {
        rank: player.rank,
        userId: player.userId,
        userName: player.userName,
        tier: tier.title,
        tierColor: tier.color,
        stats: {
          gamesPlayed: player.stats.gamesPlayed,
          wins: player.stats.wins,
          winRate: Math.round(derived.winRate * 10) / 10,
          challengesWon: player.stats.challengesWon,
          advantagesFound: player.stats.advantagesFound,
          totalInsightPoints: player.stats.totalInsightPoints,
          daysPlayed: player.stats.daysPlayed,
        },
        value: player.value,
      };
    });

    // Get user's position if requested
    let userPosition = null;
    if (userId) {
      const userRank = rankedPlayers.find((p) => p.userId === userId);
      if (userRank) {
        const derived = calculateDerivedStats(userRank.stats);
        const tier = getPlayerTier(userRank.stats);

        // Calculate percentiles
        const allWins = playersWithStats.map((p) => p.wins);
        const allChallenges = playersWithStats.map((p) => p.challengesWon);
        const allInsights = playersWithStats.map((p) => p.totalInsightPoints);

        userPosition = {
          rank: userRank.rank,
          tier: tier.title,
          tierDescription: tier.description,
          stats: {
            ...userRank.stats,
            derived,
          },
          percentiles: {
            wins: calculatePercentile(userRank.stats.wins, allWins),
            challenges: calculatePercentile(userRank.stats.challengesWon, allChallenges),
            insights: calculatePercentile(userRank.stats.totalInsightPoints, allInsights),
          },
          achievements: getAchievements(userRank.stats),
        };
      }
    }

    return NextResponse.json({
      leaderboard,
      totalPlayers: allStats.length,
      stat: statToRankBy,
      userPosition,
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
