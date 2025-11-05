// Rumor System for Castaway Council
// Dynamic rumors create paranoia and strategic opportunities

export interface Rumor {
  id: string;
  content: string;
  truthful: boolean;
  targetPlayerId?: string;
  visibleTo: string; // 'all', 'tribe:id', 'player:id'
  day: number;
  expiresInDays: number;
  impact: 'low' | 'medium' | 'high';
}

export type RumorCategory =
  | 'advantage'
  | 'alliance'
  | 'voting'
  | 'betrayal'
  | 'challenge'
  | 'personal'
  | 'twist';

interface RumorTemplate {
  category: RumorCategory;
  truthfulVersion: (context: any) => string;
  falseVersion: (context: any) => string;
  impact: 'low' | 'medium' | 'high';
  requiresTarget: boolean;
}

const rumorTemplates: RumorTemplate[] = [
  {
    category: 'advantage',
    truthfulVersion: (ctx) =>
      `${ctx.playerName || 'Someone'} found a hidden advantage at camp.`,
    falseVersion: (ctx) =>
      `Rumor has it ${ctx.playerName || 'someone'} has an advantage, but do they really?`,
    impact: 'high',
    requiresTarget: true,
  },
  {
    category: 'advantage',
    truthfulVersion: () => 'An advantage is hidden somewhere near the water source.',
    falseVersion: () => 'People are searching near the water, but there might be nothing there.',
    impact: 'medium',
    requiresTarget: false,
  },
  {
    category: 'alliance',
    truthfulVersion: (ctx) =>
      `${ctx.player1} and ${ctx.player2} were spotted having a secret meeting last night.`,
    falseVersion: (ctx) =>
      `Whispers suggest ${ctx.player1} and ${ctx.player2} are working together, but it could be coincidence.`,
    impact: 'medium',
    requiresTarget: false,
  },
  {
    category: 'voting',
    truthfulVersion: (ctx) =>
      `${ctx.playerName} is the target for tonight's vote.`,
    falseVersion: (ctx) =>
      `Some think ${ctx.playerName} might be in trouble, but nothing is confirmed.`,
    impact: 'high',
    requiresTarget: true,
  },
  {
    category: 'betrayal',
    truthfulVersion: (ctx) =>
      `${ctx.playerName} is planning to flip on their alliance.`,
    falseVersion: (ctx) =>
      `${ctx.playerName} seems distant from their allies. Are they planning something?`,
    impact: 'high',
    requiresTarget: true,
  },
  {
    category: 'challenge',
    truthfulVersion: () => 'Tomorrow's challenge will test endurance and mental fortitude.',
    falseVersion: () => 'Rumor says the next challenge is physical, but who knows for sure?',
    impact: 'low',
    requiresTarget: false,
  },
  {
    category: 'personal',
    truthfulVersion: (ctx) =>
      `${ctx.playerName} is struggling with low stats and might need help.`,
    falseVersion: (ctx) =>
      `${ctx.playerName} looks tired, but they might be faking weakness.`,
    impact: 'low',
    requiresTarget: true,
  },
  {
    category: 'twist',
    truthfulVersion: () => 'A major twist is coming that will change the game.',
    falseVersion: () => 'People are nervous about a potential twist, but nothing confirmed.',
    impact: 'medium',
    requiresTarget: false,
  },
  {
    category: 'alliance',
    truthfulVersion: (ctx) =>
      `A majority alliance has formed with ${ctx.count || 'several'} members.`,
    falseVersion: (ctx) =>
      `There might be a secret alliance, but it's hard to tell who's in it.`,
    impact: 'high',
    requiresTarget: false,
  },
  {
    category: 'advantage',
    truthfulVersion: (ctx) =>
      `${ctx.playerName} played an advantage at the last tribal council.`,
    falseVersion: (ctx) =>
      `Did ${ctx.playerName} have an advantage? Some say yes, others aren't sure.`,
    impact: 'medium',
    requiresTarget: true,
  },
];

/**
 * Generate a random rumor
 */
export function generateRumor(
  day: number,
  context: {
    players: Array<{ id: string; name: string }>;
    recentEvents: string[];
    tribeIds: string[];
  }
): Rumor {
  // Select random template
  const template = rumorTemplates[Math.floor(Math.random() * rumorTemplates.length)]!;

  // Determine if truthful (60% true, 40% false)
  const truthful = Math.random() < 0.6;

  // Build context for template
  const rumor Context = buildRumorContext(template, context);

  // Generate content
  const content = truthful
    ? template.truthfulVersion(rumorContext)
    : template.falseVersion(rumorContext);

  // Determine visibility
  let visibleTo = 'all';
  const visibilityRoll = Math.random();

  if (visibilityRoll < 0.2 && context.tribeIds.length > 0) {
    // 20% chance tribe-specific
    const tribeId = context.tribeIds[Math.floor(Math.random() * context.tribeIds.length)]!;
    visibleTo = `tribe:${tribeId}`;
  } else if (visibilityRoll < 0.3 && context.players.length > 0) {
    // 10% chance player-specific
    const playerId = context.players[Math.floor(Math.random() * context.players.length)]!.id;
    visibleTo = `player:${playerId}`;
  }

  // Determine expiration (1-3 days)
  const expiresInDays = 1 + Math.floor(Math.random() * 3);

  return {
    id: `rumor_${day}_${Date.now()}`,
    content,
    truthful,
    targetPlayerId: rumorContext.targetPlayerId,
    visibleTo,
    day,
    expiresInDays,
    impact: template.impact,
  };
}

function buildRumorContext(
  template: RumorTemplate,
  context: {
    players: Array<{ id: string; name: string }>;
    recentEvents: string[];
    tribeIds: string[];
  }
): any {
  const rumor Context: any = {};

  if (template.requiresTarget && context.players.length > 0) {
    const targetPlayer =
      context.players[Math.floor(Math.random() * context.players.length)]!;
    rumorContext.playerName = targetPlayer.name;
    rumorContext.targetPlayerId = targetPlayer.id;
  }

  if (template.category === 'alliance' && context.players.length >= 2) {
    const shuffled = [...context.players].sort(() => Math.random() - 0.5);
    rumorContext.player1 = shuffled[0]?.name;
    rumorContext.player2 = shuffled[1]?.name;
  }

  if (template.category === 'alliance') {
    rumorContext.count = 3 + Math.floor(Math.random() * 4); // 3-6 members
  }

  return rumorContext;
}

/**
 * Check if a rumor should be visible to a player
 */
export function isRumorVisibleToPlayer(
  rumor: Rumor,
  playerId: string,
  playerTribeId?: string
): boolean {
  if (rumor.visibleTo === 'all') return true;

  if (rumor.visibleTo.startsWith('tribe:')) {
    const tribeId = rumor.visibleTo.split(':')[1];
    return playerTribeId === tribeId;
  }

  if (rumor.visibleTo.startsWith('player:')) {
    const targetId = rumor.visibleTo.split(':')[1];
    return playerId === targetId;
  }

  return false;
}

/**
 * Get impact of rumor on player relationships
 */
export function getRumorImpact(rumor: Rumor): {
  trustModifier: number;
  paranoiaLevel: number;
  strategicValue: number;
} {
  const baseImpact = {
    low: { trustModifier: -2, paranoiaLevel: 5, strategicValue: 3 },
    medium: { trustModifier: -5, paranoiaLevel: 10, strategicValue: 7 },
    high: { trustModifier: -10, paranoiaLevel: 20, strategicValue: 15 },
  };

  let impact = baseImpact[rumor.impact];

  // False rumors create more paranoia
  if (!rumor.truthful) {
    impact = {
      ...impact,
      paranoiaLevel: impact.paranoiaLevel * 1.5,
      strategicValue: impact.strategicValue * 0.7,
    };
  }

  return impact;
}

/**
 * Generate contextual rumors based on game state
 */
export function generateContextualRumor(
  day: number,
  gameState: {
    recentAdvantageFound?: boolean;
    recentVote?: { votedOut: string };
    upcomingMerge?: boolean;
    lowStatPlayers?: string[];
    dominantAlliance?: boolean;
  },
  context: {
    players: Array<{ id: string; name: string }>;
    tribeIds: string[];
  }
): Rumor {
  // Generate rumor based on recent events
  if (gameState.recentAdvantageFound && Math.random() < 0.7) {
    const player = context.players[Math.floor(Math.random() * context.players.length)];
    return {
      id: `rumor_contextual_${day}_${Date.now()}`,
      content: `Word around camp is that ${player?.name || 'someone'} found something valuable recently.`,
      truthful: Math.random() < 0.6,
      targetPlayerId: player?.id,
      visibleTo: 'all',
      day,
      expiresInDays: 2,
      impact: 'high',
    };
  }

  if (gameState.upcomingMerge && Math.random() < 0.8) {
    return {
      id: `rumor_contextual_${day}_${Date.now()}`,
      content: 'The merge is coming soon. Cross-tribal alliances are forming in secret.',
      truthful: true,
      visibleTo: 'all',
      day,
      expiresInDays: 1,
      impact: 'high',
    };
  }

  if (gameState.dominantAlliance && Math.random() < 0.7) {
    return {
      id: `rumor_contextual_${day}_${Date.now()}`,
      content: 'A powerful alliance is running the game. If you're not in it, you're a target.',
      truthful: true,
      visibleTo: 'all',
      day,
      expiresInDays: 2,
      impact: 'high',
    };
  }

  if (gameState.lowStatPlayers && gameState.lowStatPlayers.length > 0) {
    const targetId = gameState.lowStatPlayers[Math.floor(Math.random() * gameState.lowStatPlayers.length)];
    const player = context.players.find((p) => p.id === targetId);
    return {
      id: `rumor_contextual_${day}_${Date.now()}`,
      content: `${player?.name || 'Someone'} might be in danger of medical evacuation. Their stats are critically low.`,
      truthful: true,
      targetPlayerId: targetId,
      visibleTo: 'all',
      day,
      expiresInDays: 1,
      impact: 'medium',
    };
  }

  // Fallback to random rumor
  return generateRumor(day, { ...context, recentEvents: [] });
}

/**
 * Get rumor icon for display
 */
export function getRumorIcon(category?: RumorCategory): string {
  if (!category) return '💭';

  const icons: Record<RumorCategory, string> = {
    advantage: '🔍',
    alliance: '🤝',
    voting: '🗳️',
    betrayal: '🔪',
    challenge: '🏆',
    personal: '👤',
    twist: '🌀',
  };
  return icons[category] || '💭';
}

/**
 * Get rumor color for UI
 */
export function getRumorColor(impact: 'low' | 'medium' | 'high', truthful: boolean): string {
  if (truthful) {
    return impact === 'high'
      ? 'from-red-600 to-red-800'
      : impact === 'medium'
      ? 'from-orange-500 to-orange-700'
      : 'from-yellow-500 to-yellow-700';
  } else {
    return impact === 'high'
      ? 'from-purple-600 to-purple-800'
      : impact === 'medium'
      ? 'from-indigo-500 to-indigo-700'
      : 'from-blue-500 to-blue-700';
  }
}
