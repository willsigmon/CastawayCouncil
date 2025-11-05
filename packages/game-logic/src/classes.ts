/**
 * Player classes and their abilities
 * Each player chooses one class that grants special bonuses
 */

export type PlayerClass = 'athlete' | 'strategist' | 'survivalist' | 'opportunist' | 'diplomat' | 'wildcard';

export interface ClassAbility {
  name: string;
  description: string;
  bonuses: {
    challengeBonus?: number; // Percentage bonus to challenge effectiveness
    puzzleHints?: number; // Extra hints in puzzle challenges
    statDecayMultiplier?: number; // Multiplier for stat decay (0.9 = 10% slower)
    findSuccessBonus?: number; // Bonus to finding advantages/fishing
    tribeEffectiveness?: number; // Bonus to entire tribe's effectiveness
  };
}

export const PlayerClasses: Record<PlayerClass, ClassAbility> = {
  athlete: {
    name: 'Athlete',
    description: 'Small early start in physical challenges',
    bonuses: {
      challengeBonus: 5, // 5% bonus in physical challenges
    },
  },
  strategist: {
    name: 'Strategist',
    description: '+1 extra hint on puzzle/word challenges',
    bonuses: {
      puzzleHints: 1,
    },
  },
  survivalist: {
    name: 'Survivalist',
    description: 'Stats decay slower; +10% to find/fish success',
    bonuses: {
      statDecayMultiplier: 0.85, // 15% slower decay
      findSuccessBonus: 10,
    },
  },
  opportunist: {
    name: 'Opportunist',
    description: 'Early start on puzzle challenges',
    bonuses: {
      challengeBonus: 5, // 5% bonus in puzzle challenges
    },
  },
  diplomat: {
    name: 'Diplomat',
    description: '+5% tribe effectiveness overall',
    bonuses: {
      tribeEffectiveness: 5,
    },
  },
  wildcard: {
    name: 'Wildcard',
    description: 'Inherits one random class ability per day (rotates post-tribal)',
    bonuses: {
      // Wildcard gets a random ability each day
    },
  },
};

/**
 * Get the ability for a player, including wildcard daily rotation
 */
export function getPlayerAbility(
  playerClass: PlayerClass,
  wildcardAbility?: PlayerClass
): ClassAbility {
  if (playerClass === 'wildcard' && wildcardAbility) {
    return PlayerClasses[wildcardAbility];
  }
  return PlayerClasses[playerClass];
}

/**
 * Roll a new wildcard ability (excludes wildcard itself)
 */
export function rollWildcardAbility(): PlayerClass {
  const nonWildcardClasses: PlayerClass[] = [
    'athlete',
    'strategist',
    'survivalist',
    'opportunist',
    'diplomat',
  ];
  const randomIndex = Math.floor(Math.random() * nonWildcardClasses.length);
  return nonWildcardClasses[randomIndex]!;
}

/**
 * Apply class bonuses to challenge effectiveness
 */
export function applyClassBonusToChallenge(
  baseEffectiveness: number,
  playerClass: PlayerClass,
  wildcardAbility?: PlayerClass,
  challengeType?: 'physical' | 'puzzle'
): number {
  const ability = getPlayerAbility(playerClass, wildcardAbility);

  let effectiveness = baseEffectiveness;

  // Apply challenge bonus if applicable
  if (ability.bonuses.challengeBonus) {
    if (
      (playerClass === 'athlete' && challengeType === 'physical') ||
      (playerClass === 'opportunist' && challengeType === 'puzzle') ||
      (playerClass === 'wildcard' && wildcardAbility)
    ) {
      effectiveness *= 1 + ability.bonuses.challengeBonus / 100;
    }
  }

  return effectiveness;
}

/**
 * Apply survivalist bonus to stat decay
 */
export function applyStatDecay(
  currentStat: number,
  decayAmount: number,
  playerClass: PlayerClass,
  wildcardAbility?: PlayerClass
): number {
  const ability = getPlayerAbility(playerClass, wildcardAbility);

  let actualDecay = decayAmount;

  if (ability.bonuses.statDecayMultiplier) {
    actualDecay *= ability.bonuses.statDecayMultiplier;
  }

  return Math.max(0, currentStat - actualDecay);
}

/**
 * Apply class bonus to finding advantages or fishing
 */
export function calculateFindSuccessRate(
  baseRate: number,
  playerClass: PlayerClass,
  wildcardAbility?: PlayerClass
): number {
  const ability = getPlayerAbility(playerClass, wildcardAbility);

  let rate = baseRate;

  if (ability.bonuses.findSuccessBonus) {
    rate += ability.bonuses.findSuccessBonus;
  }

  return Math.min(100, Math.max(0, rate));
}

/**
 * Get puzzle hints based on class
 */
export function getPuzzleHints(
  baseHints: number,
  playerClass: PlayerClass,
  wildcardAbility?: PlayerClass
): number {
  const ability = getPlayerAbility(playerClass, wildcardAbility);

  return baseHints + (ability.bonuses.puzzleHints || 0);
}

/**
 * Apply diplomat bonus to tribe
 */
export function applyDiplomatBonus(
  tribeMembers: Array<{ playerClass: PlayerClass; wildcardAbility?: PlayerClass }>,
  baseEffectiveness: number
): number {
  let effectiveness = baseEffectiveness;

  for (const member of tribeMembers) {
    const ability = getPlayerAbility(member.playerClass, member.wildcardAbility);
    if (ability.bonuses.tribeEffectiveness) {
      effectiveness *= 1 + ability.bonuses.tribeEffectiveness / 100;
    }
  }

  return effectiveness;
}
