/**
 * Career Stats System
 * Tracks player performance across all seasons
 */

export interface CareerStats {
  userId: string;
  gamesPlayed: number;
  wins: number;
  finalThree: number;
  juryAppearances: number;
  advantagesFound: number;
  advantagesPlayed: number;
  alliancesFormed: number;
  challengesWon: number;
  daysPlayed: number;
  votesReceived: number;
  votesCast: number;
  confessionalsMade: number;
  totalInsightPoints: number;
}

export interface SeasonPerformance {
  seasonId: string;
  placement: number;
  daysPlayed: number;
  challengesWon: number;
  advantagesFound: number;
  votesReceived: number;
  votesCast: number;
  confessionalsMade: number;
  insightPoints: number;
  winner: boolean;
  finalThree: boolean;
  juryMember: boolean;
}

/**
 * Calculate career stats from season performances
 */
export function calculateCareerStats(
  performances: SeasonPerformance[]
): Omit<CareerStats, 'userId'> {
  return {
    gamesPlayed: performances.length,
    wins: performances.filter((p) => p.winner).length,
    finalThree: performances.filter((p) => p.finalThree).length,
    juryAppearances: performances.filter((p) => p.juryMember).length,
    advantagesFound: performances.reduce((sum, p) => sum + p.advantagesFound, 0),
    advantagesPlayed: performances.reduce((sum, p) => sum + p.advantagesFound, 0), // Simplified
    alliancesFormed: 0, // TODO: Track alliances per season
    challengesWon: performances.reduce((sum, p) => sum + p.challengesWon, 0),
    daysPlayed: performances.reduce((sum, p) => sum + p.daysPlayed, 0),
    votesReceived: performances.reduce((sum, p) => sum + p.votesReceived, 0),
    votesCast: performances.reduce((sum, p) => sum + p.votesCast, 0),
    confessionalsMade: performances.reduce((sum, p) => sum + p.confessionalsMade, 0),
    totalInsightPoints: performances.reduce((sum, p) => sum + p.insightPoints, 0),
  };
}

/**
 * Calculate derived stats and percentages
 */
export function calculateDerivedStats(stats: CareerStats): {
  winRate: number;
  avgDaysPlayed: number;
  avgChallengesPerGame: number;
  avgAdvantagesPerGame: number;
  finalThreeRate: number;
  juryAppearanceRate: number;
} {
  const gp = stats.gamesPlayed || 1; // Avoid division by zero

  return {
    winRate: (stats.wins / gp) * 100,
    avgDaysPlayed: stats.daysPlayed / gp,
    avgChallengesPerGame: stats.challengesWon / gp,
    avgAdvantagesPerGame: stats.advantagesFound / gp,
    finalThreeRate: (stats.finalThree / gp) * 100,
    juryAppearanceRate: (stats.juryAppearances / gp) * 100,
  };
}

/**
 * Get player ranking based on a specific stat
 */
export function rankPlayers(
  players: Array<CareerStats & { userName: string }>,
  stat:
    | 'wins'
    | 'winRate'
    | 'challengesWon'
    | 'advantagesFound'
    | 'totalInsightPoints'
    | 'daysPlayed'
): Array<{
  rank: number;
  userId: string;
  userName: string;
  value: number;
  stats: CareerStats;
}> {
  const playersWithValue = players.map((player) => {
    let value: number;

    if (stat === 'winRate') {
      value = calculateDerivedStats(player).winRate;
    } else {
      value = player[stat];
    }

    return {
      userId: player.userId,
      userName: player.userName,
      value,
      stats: player,
    };
  });

  // Sort descending
  playersWithValue.sort((a, b) => b.value - a.value);

  // Assign ranks
  return playersWithValue.map((player, index) => ({
    rank: index + 1,
    ...player,
  }));
}

/**
 * Calculate player's percentile ranking
 */
export function calculatePercentile(
  playerValue: number,
  allValues: number[]
): number {
  if (allValues.length === 0) return 100;

  const lowerCount = allValues.filter((v) => v < playerValue).length;
  return Math.round((lowerCount / allValues.length) * 100);
}

/**
 * Get achievement badges based on career stats
 */
export function getAchievements(stats: CareerStats): Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
  max?: number;
}> {
  return [
    {
      id: 'first_win',
      name: 'Sole Survivor',
      description: 'Win your first season',
      icon: '🏆',
      earned: stats.wins >= 1,
    },
    {
      id: 'veteran',
      name: 'Veteran',
      description: 'Play 5 seasons',
      icon: '🎖️',
      earned: stats.gamesPlayed >= 5,
      progress: stats.gamesPlayed,
      max: 5,
    },
    {
      id: 'challenge_beast',
      name: 'Challenge Beast',
      description: 'Win 20 challenges',
      icon: '💪',
      earned: stats.challengesWon >= 20,
      progress: stats.challengesWon,
      max: 20,
    },
    {
      id: 'advantage_hunter',
      name: 'Advantage Hunter',
      description: 'Find 10 advantages',
      icon: '🔍',
      earned: stats.advantagesFound >= 10,
      progress: stats.advantagesFound,
      max: 10,
    },
    {
      id: 'storyteller',
      name: 'Storyteller',
      description: 'Record 50 confessionals',
      icon: '📹',
      earned: stats.confessionalsMade >= 50,
      progress: stats.confessionalsMade,
      max: 50,
    },
    {
      id: 'insight_master',
      name: 'Insight Master',
      description: 'Earn 200 insight points',
      icon: '🧠',
      earned: stats.totalInsightPoints >= 200,
      progress: stats.totalInsightPoints,
      max: 200,
    },
    {
      id: 'final_three',
      name: 'Finalist',
      description: 'Reach final three',
      icon: '🥉',
      earned: stats.finalThree >= 1,
    },
    {
      id: 'jury_member',
      name: 'Jury Duty',
      description: 'Serve on the jury',
      icon: '⚖️',
      earned: stats.juryAppearances >= 1,
    },
    {
      id: 'multi_winner',
      name: 'Dynasty',
      description: 'Win 3 seasons',
      icon: '👑',
      earned: stats.wins >= 3,
      progress: stats.wins,
      max: 3,
    },
    {
      id: 'marathon_runner',
      name: 'Marathon Runner',
      description: 'Play 100 total days',
      icon: '🏃',
      earned: stats.daysPlayed >= 100,
      progress: stats.daysPlayed,
      max: 100,
    },
  ];
}

/**
 * Get tier/rank title based on total stats
 */
export function getPlayerTier(stats: CareerStats): {
  tier: number;
  title: string;
  color: string;
  description: string;
} {
  const score =
    stats.wins * 100 +
    stats.finalThree * 50 +
    stats.challengesWon * 5 +
    stats.advantagesFound * 10 +
    stats.totalInsightPoints;

  if (score >= 1000) {
    return {
      tier: 6,
      title: 'Legend',
      color: 'text-purple-600',
      description: 'Elite player with exceptional performance',
    };
  } else if (score >= 500) {
    return {
      tier: 5,
      title: 'Master',
      color: 'text-yellow-600',
      description: 'Highly skilled and experienced player',
    };
  } else if (score >= 250) {
    return {
      tier: 4,
      title: 'Expert',
      color: 'text-blue-600',
      description: 'Skilled player with solid track record',
    };
  } else if (score >= 100) {
    return {
      tier: 3,
      title: 'Competitor',
      color: 'text-green-600',
      description: 'Experienced player',
    };
  } else if (score >= 25) {
    return {
      tier: 2,
      title: 'Rookie',
      color: 'text-gray-600',
      description: 'New player learning the ropes',
    };
  } else {
    return {
      tier: 1,
      title: 'Novice',
      color: 'text-gray-400',
      description: 'Just getting started',
    };
  }
}
