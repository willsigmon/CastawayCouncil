/**
 * Confessional Insights System
 * Players earn "insight points" by recording strategic confessionals
 */

export interface Confessional {
  id: string;
  playerId: string;
  body: string;
  visibility: 'private' | 'postseason';
  createdAt: Date;
}

export interface ConfessionalInsight {
  confessionalId: string;
  playerId: string;
  insightPoints: number;
  category: 'strategy' | 'social' | 'observation' | 'prediction' | 'self_reflection';
  reason: string;
}

/**
 * Analyze confessional content and award insight points
 *
 * Insight points are awarded for:
 * - Strategic thinking (3-5 points)
 * - Social observations (2-4 points)
 * - Predictions about the game (2-3 points)
 * - Self-reflection (1-2 points)
 * - Detailed observations (1-3 points)
 */
export function analyzeConfessional(
  confessional: Omit<Confessional, 'id' | 'createdAt'>,
  context?: {
    recentActions?: string[];
    relationships?: Array<{ playerId: string; trust: number }>;
  }
): ConfessionalInsight {
  const body = confessional.body.toLowerCase();
  const wordCount = confessional.body.split(/\s+/).length;

  let points = 0;
  let category: ConfessionalInsight['category'] = 'self_reflection';
  let reason = '';

  // Detect category and assign base points
  const strategyKeywords = ['alliance', 'vote', 'target', 'plan', 'strategy', 'move', 'flip', 'blindside'];
  const socialKeywords = ['trust', 'relationship', 'friend', 'enemy', 'ally', 'betrayal', 'bond'];
  const observationKeywords = ['noticed', 'saw', 'observed', 'watching', 'suspicious', 'behavior'];
  const predictionKeywords = ['think', 'believe', 'predict', 'will', 'going to', 'next', 'expect'];

  const strategyCount = strategyKeywords.filter(k => body.includes(k)).length;
  const socialCount = socialKeywords.filter(k => body.includes(k)).length;
  const observationCount = observationKeywords.filter(k => body.includes(k)).length;
  const predictionCount = predictionKeywords.filter(k => body.includes(k)).length;

  // Determine category based on keyword density
  if (strategyCount >= 2) {
    category = 'strategy';
    points = 3 + Math.min(strategyCount, 2); // 3-5 points
    reason = 'Strategic thinking about game moves';
  } else if (socialCount >= 2) {
    category = 'social';
    points = 2 + Math.min(socialCount, 2); // 2-4 points
    reason = 'Social observations and relationship analysis';
  } else if (observationCount >= 2) {
    category = 'observation';
    points = 2 + Math.min(observationCount, 1); // 2-3 points
    reason = 'Detailed observations about the game';
  } else if (predictionCount >= 2) {
    category = 'prediction';
    points = 2 + Math.min(predictionCount, 1); // 2-3 points
    reason = 'Predictions about future game events';
  } else {
    category = 'self_reflection';
    points = 1;
    reason = 'Personal reflection';
  }

  // Bonus for length (detailed confessionals)
  if (wordCount >= 100) {
    points += 2;
    reason += ' (detailed)';
  } else if (wordCount >= 50) {
    points += 1;
    reason += ' (substantial)';
  }

  // Bonus for mentioning multiple players (shows awareness)
  const playerMentions = (body.match(/@\w+/g) || []).length;
  if (playerMentions >= 3) {
    points += 2;
    reason += ' (multiple player mentions)';
  } else if (playerMentions >= 2) {
    points += 1;
    reason += ' (player mentions)';
  }

  // Cap at 10 points per confessional
  points = Math.min(points, 10);

  return {
    confessionalId: '', // Will be set by caller
    playerId: confessional.playerId,
    insightPoints: points,
    category,
    reason,
  };
}

/**
 * Calculate total insight points for a player
 */
export function calculateTotalInsightPoints(insights: ConfessionalInsight[]): {
  total: number;
  byCategory: Record<string, number>;
  count: number;
} {
  const total = insights.reduce((sum, insight) => sum + insight.insightPoints, 0);
  const byCategory: Record<string, number> = {};

  for (const insight of insights) {
    byCategory[insight.category] = (byCategory[insight.category] || 0) + insight.insightPoints;
  }

  return {
    total,
    byCategory,
    count: insights.length,
  };
}

/**
 * Get confessional rewards based on total insight points
 *
 * Rewards unlock at milestone thresholds:
 * - 10 points: Small stat boost
 * - 25 points: Jury favor +1
 * - 50 points: Hidden advantage clue
 * - 100 points: Extra vote advantage
 */
export function getConfessionalRewards(totalPoints: number): Array<{
  threshold: number;
  reward: string;
  description: string;
  unlocked: boolean;
}> {
  const rewards = [
    {
      threshold: 10,
      reward: 'stat_boost',
      description: '+10 to all stats',
      unlocked: totalPoints >= 10,
    },
    {
      threshold: 25,
      reward: 'jury_favor',
      description: '+1 jury influence',
      unlocked: totalPoints >= 25,
    },
    {
      threshold: 50,
      reward: 'advantage_clue',
      description: 'Clue to hidden advantage location',
      unlocked: totalPoints >= 50,
    },
    {
      threshold: 100,
      reward: 'extra_vote',
      description: 'Extra vote advantage',
      unlocked: totalPoints >= 100,
    },
  ];

  return rewards;
}

/**
 * Suggest confessional prompts to inspire players
 */
export function getConfessionalPrompts(context: {
  day: number;
  hasAlliance: boolean;
  lowStats: boolean;
  recentElimination?: string;
}): string[] {
  const prompts: string[] = [];

  // Day-specific prompts
  if (context.day === 1) {
    prompts.push("What are your first impressions of your tribemates?");
    prompts.push("What's your strategy for the first few days?");
  } else if (context.day <= 5) {
    prompts.push("How are you building trust with your tribe?");
    prompts.push("Who do you see as a threat?");
  } else if (context.day <= 10) {
    prompts.push("What alliances are forming?");
    prompts.push("Who would you target if you had to vote someone out?");
  } else {
    prompts.push("What's your path to the finale?");
    prompts.push("Who would you take to the final three?");
  }

  // Context-specific prompts
  if (context.hasAlliance) {
    prompts.push("How solid is your alliance?");
    prompts.push("Would you betray your alliance if needed?");
  }

  if (context.lowStats) {
    prompts.push("How are you managing your survival stats?");
    prompts.push("What's your plan to recover?");
  }

  if (context.recentElimination) {
    prompts.push(`What do you think about ${context.recentElimination}'s elimination?`);
    prompts.push("How does this change the game for you?");
  }

  // Always available
  prompts.push("What's happening that others might not see?");
  prompts.push("What are you most worried about?");
  prompts.push("What's your biggest move so far?");

  return prompts;
}
