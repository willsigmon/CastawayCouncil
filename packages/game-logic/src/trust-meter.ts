// Trust Meter System for Castaway Council
// Track relationships, trust levels, and alliance strength

export interface PlayerRelationship {
  playerId: string;
  targetPlayerId: string;
  trustLevel: number; // 0-100
  allianceStrength: number; // 0-100
  interactions: number;
  votedTogether: number;
  votedAgainst: number;
  lastInteraction: Date | null;
}

export interface RelationshipUpdate {
  trustChange: number;
  allianceChange: number;
  reason: string;
}

export type InteractionType =
  | 'chat_message'
  | 'private_dm'
  | 'vote_together'
  | 'vote_against'
  | 'help_action'
  | 'share_resource'
  | 'betrayal'
  | 'alliance_formed'
  | 'challenge_cooperation'
  | 'save_from_vote';

/**
 * Calculate trust change based on interaction type
 */
export function calculateTrustChange(
  interaction: InteractionType,
  currentTrust: number,
  context?: {
    repeated?: boolean;
    public?: boolean;
    magnitude?: number;
  }
): RelationshipUpdate {
  const baseChanges: Record<InteractionType, { trust: number; alliance: number }> = {
    chat_message: { trust: 1, alliance: 0 },
    private_dm: { trust: 2, alliance: 1 },
    vote_together: { trust: 8, alliance: 10 },
    vote_against: { trust: -15, alliance: -20 },
    help_action: { trust: 5, alliance: 3 },
    share_resource: { trust: 6, alliance: 4 },
    betrayal: { trust: -30, alliance: -40 },
    alliance_formed: { trust: 15, alliance: 25 },
    challenge_cooperation: { trust: 7, alliance: 8 },
    save_from_vote: { trust: 20, alliance: 30 },
  };

  let { trust, alliance } = baseChanges[interaction];

  // Apply diminishing returns for high trust
  if (currentTrust > 70 && trust > 0) {
    trust = Math.floor(trust * 0.5);
  }

  // Repeated interactions have diminishing returns
  if (context?.repeated) {
    trust = Math.floor(trust * 0.7);
    alliance = Math.floor(alliance * 0.7);
  }

  // Public interactions (visible to others) have less alliance impact
  if (context?.public && interaction !== 'vote_together') {
    alliance = Math.floor(alliance * 0.6);
  }

  // Magnitude multiplier
  if (context?.magnitude) {
    trust = Math.floor(trust * context.magnitude);
    alliance = Math.floor(alliance * context.magnitude);
  }

  return {
    trustChange: trust,
    allianceChange: alliance,
    reason: getInteractionReason(interaction),
  };
}

function getInteractionReason(interaction: InteractionType): string {
  const reasons: Record<InteractionType, string> = {
    chat_message: 'Friendly conversation',
    private_dm: 'Private discussion',
    vote_together: 'Voted the same way',
    vote_against: 'Voted against each other',
    help_action: 'Helped with camp action',
    share_resource: 'Shared resources',
    betrayal: 'BETRAYAL',
    alliance_formed: 'Formed alliance',
    challenge_cooperation: 'Worked together in challenge',
    save_from_vote: 'Saved from elimination',
  };
  return reasons[interaction];
}

/**
 * Update relationship based on interaction
 */
export function updateRelationship(
  current: PlayerRelationship,
  interaction: InteractionType,
  context?: {
    repeated?: boolean;
    public?: boolean;
    magnitude?: number;
  }
): PlayerRelationship {
  const update = calculateTrustChange(interaction, current.trustLevel, context);

  let newTrust = current.trustLevel + update.trustChange;
  let newAlliance = current.allianceStrength + update.allianceChange;

  // Clamp values
  newTrust = Math.max(0, Math.min(100, newTrust));
  newAlliance = Math.max(0, Math.min(100, newAlliance));

  // Special handling for betrayal - alliance drops faster than trust
  if (interaction === 'betrayal') {
    newAlliance = Math.max(0, newAlliance - 10);
  }

  // Update vote counters
  let votedTogether = current.votedTogether;
  let votedAgainst = current.votedAgainst;

  if (interaction === 'vote_together') votedTogether++;
  if (interaction === 'vote_against') votedAgainst++;

  return {
    ...current,
    trustLevel: newTrust,
    allianceStrength: newAlliance,
    interactions: current.interactions + 1,
    votedTogether,
    votedAgainst,
    lastInteraction: new Date(),
  };
}

/**
 * Get relationship tier based on trust and alliance
 */
export function getRelationshipTier(relationship: PlayerRelationship): {
  tier: 'enemy' | 'stranger' | 'acquaintance' | 'friend' | 'close_ally' | 'final_two';
  description: string;
  color: string;
} {
  const { trustLevel, allianceStrength } = relationship;
  const combined = (trustLevel + allianceStrength) / 2;

  if (combined < 20) {
    return {
      tier: 'enemy',
      description: 'Enemy - High tension',
      color: 'red',
    };
  } else if (combined < 40) {
    return {
      tier: 'stranger',
      description: 'Stranger - Minimal connection',
      color: 'gray',
    };
  } else if (combined < 60) {
    return {
      tier: 'acquaintance',
      description: 'Acquaintance - Casual relationship',
      color: 'yellow',
    };
  } else if (combined < 75) {
    return {
      tier: 'friend',
      description: 'Friend - Trustworthy ally',
      color: 'green',
    };
  } else if (combined < 90) {
    return {
      tier: 'close_ally',
      description: 'Close Ally - Strong bond',
      color: 'blue',
    };
  } else {
    return {
      tier: 'final_two',
      description: 'Final Two - Unbreakable alliance',
      color: 'purple',
    };
  }
}

/**
 * Calculate alliance stability (how likely it is to hold)
 */
export function calculateAllianceStability(relationship: PlayerRelationship): {
  stability: number; // 0-100
  risk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
} {
  const factors: string[] = [];
  let stability = relationship.allianceStrength;

  // Trust must support alliance
  const trustGap = relationship.allianceStrength - relationship.trustLevel;
  if (trustGap > 20) {
    stability -= 15;
    factors.push('Alliance built on shaky trust');
  }

  // Voting history
  if (relationship.votedAgainst > 0) {
    const penalty = relationship.votedAgainst * 10;
    stability -= penalty;
    factors.push(`Voted against each other ${relationship.votedAgainst} time(s)`);
  }

  if (relationship.votedTogether > 3) {
    stability += 10;
    factors.push(`Strong voting record together`);
  }

  // Recent interaction
  if (relationship.lastInteraction) {
    const daysSince = Math.floor(
      (Date.now() - relationship.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince > 3) {
      stability -= daysSince * 2;
      factors.push('Lack of recent interaction');
    }
  }

  // Interaction frequency
  if (relationship.interactions < 5) {
    stability -= 10;
    factors.push('Limited interactions');
  }

  stability = Math.max(0, Math.min(100, stability));

  let risk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  if (stability > 80) risk = 'none';
  else if (stability > 60) risk = 'low';
  else if (stability > 40) risk = 'medium';
  else if (stability > 20) risk = 'high';
  else risk = 'critical';

  return { stability, risk, factors };
}

/**
 * Predict vote patterns based on relationships
 */
export function predictVotePattern(
  playerId: string,
  relationships: PlayerRelationship[],
  targetPlayerId: string
): {
  likelihood: number; // 0-100
  confidence: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  reasoning: string[];
} {
  const targetRelationship = relationships.find(
    (r) => r.playerId === playerId && r.targetPlayerId === targetPlayerId
  );

  if (!targetRelationship) {
    return {
      likelihood: 50,
      confidence: 'very_low',
      reasoning: ['No relationship data available'],
    };
  }

  const reasoning: string[] = [];
  let likelihood = 50; // Base 50%

  // Trust level impact
  if (targetRelationship.trustLevel < 30) {
    likelihood += 30;
    reasoning.push('Low trust relationship');
  } else if (targetRelationship.trustLevel > 70) {
    likelihood -= 30;
    reasoning.push('High trust relationship');
  }

  // Alliance strength impact
  if (targetRelationship.allianceStrength < 30) {
    likelihood += 20;
    reasoning.push('Weak or no alliance');
  } else if (targetRelationship.allianceStrength > 70) {
    likelihood -= 40;
    reasoning.push('Strong alliance');
  }

  // Past voting history
  if (targetRelationship.votedAgainst > 0) {
    likelihood += targetRelationship.votedAgainst * 10;
    reasoning.push(`Has voted against them before (${targetRelationship.votedAgainst}x)`);
  }

  if (targetRelationship.votedTogether > 2) {
    likelihood -= 15;
    reasoning.push('Consistent voting ally');
  }

  // Clamp likelihood
  likelihood = Math.max(0, Math.min(100, likelihood));

  // Calculate confidence
  let confidence: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  const interactionCount = targetRelationship.interactions;

  if (interactionCount < 3) confidence = 'very_low';
  else if (interactionCount < 7) confidence = 'low';
  else if (interactionCount < 15) confidence = 'medium';
  else if (interactionCount < 25) confidence = 'high';
  else confidence = 'very_high';

  return { likelihood, confidence, reasoning };
}

/**
 * Detect natural alliance formation
 */
export function detectNaturalAlliances(
  playerId: string,
  relationships: PlayerRelationship[]
): Array<{
  allyId: string;
  strength: number;
  suggested: boolean;
}> {
  const playerRelationships = relationships.filter((r) => r.playerId === playerId);

  const alliances = playerRelationships
    .filter((r) => r.allianceStrength > 50)
    .map((r) => ({
      allyId: r.targetPlayerId,
      strength: r.allianceStrength,
      suggested: r.allianceStrength > 60 && r.trustLevel > 55,
    }))
    .sort((a, b) => b.strength - a.strength);

  return alliances;
}

/**
 * Get relationship emoji for display
 */
export function getRelationshipEmoji(relationship: PlayerRelationship): string {
  const tier = getRelationshipTier(relationship);
  const emojis: Record<string, string> = {
    enemy: '💔',
    stranger: '❓',
    acquaintance: '👋',
    friend: '🤝',
    close_ally: '💙',
    final_two: '💜',
  };
  return emojis[tier.tier] || '❓';
}
