/**
 * Camp actions: firewood, coconuts, fishing, building, water, cooking, resting, searching
 */

export interface PlayerStats {
  hunger: number;
  thirst: number;
  comfort: number;
  energy: number;
}

export interface ActionResult {
  success: boolean;
  statChanges: Partial<PlayerStats>;
  items?: Array<{ type: string; name: string; quantity: number }>;
  message: string;
  actionLog: string; // What gets posted to Action Chat
}

/**
 * Collect firewood
 */
export function collectFirewood(): ActionResult {
  const woodCollected = Math.floor(Math.random() * 3) + 1; // 1-3 pieces

  return {
    success: true,
    statChanges: {
      energy: -5, // Costs 5 energy
    },
    items: [{ type: 'material', name: 'Firewood', quantity: woodCollected }],
    message: `Collected ${woodCollected} piece${woodCollected > 1 ? 's' : ''} of firewood`,
    actionLog: `collected ${woodCollected} piece${woodCollected > 1 ? 's' : ''} of firewood`,
  };
}

/**
 * Gather coconuts
 */
export function gatherCoconuts(): ActionResult {
  const coconuts = Math.floor(Math.random() * 2) + 1; // 1-2 coconuts

  return {
    success: true,
    statChanges: {
      energy: -3,
    },
    items: [{ type: 'food', name: 'Coconut', quantity: coconuts }],
    message: `Gathered ${coconuts} coconut${coconuts > 1 ? 's' : ''}`,
    actionLog: `gathered ${coconuts} coconut${coconuts > 1 ? 's' : ''}`,
  };
}

/**
 * Spear fishing
 */
export function spearFish(
  hasSpear: boolean,
  hasFishingGear: boolean,
  classBonus: number = 0
): ActionResult {
  let catchRate = 0;
  let maxAttempts = 2;

  if (hasFishingGear) {
    catchRate = 50 + classBonus;
  } else if (hasSpear) {
    catchRate = 15 + classBonus;
  } else {
    return {
      success: false,
      statChanges: {},
      message: 'You need a spear or fishing gear to fish',
      actionLog: 'attempted to fish but had no equipment',
    };
  }

  // Try to catch fish
  const caught = Math.random() * 100 < catchRate;

  if (caught) {
    const fishCount = Math.floor(Math.random() * 2) + 1; // 1-2 fish
    return {
      success: true,
      statChanges: {
        energy: -8,
      },
      items: [{ type: 'food', name: 'Fish', quantity: fishCount }],
      message: `Caught ${fishCount} fish!`,
      actionLog: `spear fished and caught ${fishCount} fish`,
    };
  } else {
    return {
      success: false,
      statChanges: {
        energy: -8,
      },
      message: 'No fish caught this time',
      actionLog: 'spear fished but caught nothing',
    };
  }
}

/**
 * Build shelter
 */
export function buildShelter(hasFirewood: boolean): ActionResult {
  if (!hasFirewood) {
    return {
      success: false,
      statChanges: {},
      message: 'You need firewood to build shelter',
      actionLog: 'attempted to build shelter but had no firewood',
    };
  }

  return {
    success: true,
    statChanges: {
      energy: -15,
      comfort: +10,
    },
    items: [{ type: 'material', name: 'Shelter Component', quantity: 1 }],
    message: 'Built shelter improvements (+10 comfort)',
    actionLog: 'built shelter improvements',
  };
}

/**
 * Get water
 */
export function getWater(): ActionResult {
  const waterGained = Math.floor(Math.random() * 11) + 15; // 15-25 thirst
  const isTainted = Math.random() < 0.1; // 10% chance tainted

  return {
    success: true,
    statChanges: {
      thirst: waterGained,
      energy: -3,
    },
    message: `Gathered water (+${waterGained} thirst)${isTainted ? ' ⚠️ Tainted water!' : ''}`,
    actionLog: `gathered water${isTainted ? ' (tainted)' : ''}`,
  };
}

/**
 * Cook food
 */
export function cookFood(
  foodType: 'small' | 'large',
  hasFirewood: boolean
): ActionResult {
  if (!hasFirewood) {
    return {
      success: false,
      statChanges: {},
      message: 'You need firewood to cook',
      actionLog: 'attempted to cook but had no firewood',
    };
  }

  const hungerGain = foodType === 'large' ? 20 : 10;

  return {
    success: true,
    statChanges: {
      hunger: hungerGain,
      energy: -5,
    },
    message: `Cooked a ${foodType} meal (+${hungerGain} hunger)`,
    actionLog: `cooked a ${foodType} meal`,
  };
}

/**
 * Rest/Sleep
 */
export function rest(hasBlanket: boolean): ActionResult {
  const comfortGain = hasBlanket ? 20 : 10;

  return {
    success: true,
    statChanges: {
      comfort: comfortGain,
      energy: comfortGain,
    },
    message: `Rested (+${comfortGain} comfort and energy)${hasBlanket ? ' 🛏️' : ''}`,
    actionLog: `rested${hasBlanket ? ' with blanket' : ''}`,
  };
}

/**
 * Meditate
 */
export function meditate(): ActionResult {
  return {
    success: true,
    statChanges: {
      energy: +5,
    },
    message: 'Meditated for clarity (+5 energy)',
    actionLog: 'meditated',
  };
}

/**
 * Search for advantages
 * Base 33% success rate, adjusted by class bonuses
 */
export function searchForAdvantages(
  advantagesRemaining: number,
  classBonus: number = 0
): ActionResult {
  if (advantagesRemaining === 0) {
    return {
      success: false,
      statChanges: {
        energy: -10,
      },
      message: 'Searched but found nothing (no advantages currently hidden)',
      actionLog: 'searched for advantages but found nothing',
    };
  }

  const baseSuccessRate = 33; // 33% base
  const successRate = Math.min(100, baseSuccessRate + classBonus);
  const found = Math.random() * 100 < successRate;

  if (found) {
    return {
      success: true,
      statChanges: {
        energy: -10,
      },
      items: [{ type: 'advantage', name: 'Hidden Advantage', quantity: 1 }],
      message: '🎉 Found a hidden advantage!',
      actionLog: 'searched and found a HIDDEN ADVANTAGE',
    };
  } else {
    return {
      success: false,
      statChanges: {
        energy: -10,
      },
      message: 'Searched but found nothing',
      actionLog: 'searched for advantages but found nothing',
    };
  }
}

/**
 * Calculate energy from stats (average of hunger, thirst, comfort)
 */
export function calculateEnergy(stats: Omit<PlayerStats, 'energy'>): number {
  return Math.floor((stats.hunger + stats.thirst + stats.comfort) / 3);
}

/**
 * Calculate challenge effectiveness penalty based on energy
 */
export function calculateChallengeEffectiveness(energy: number): number {
  if (energy >= 80) return 1.0; // No penalty
  if (energy >= 60) return 0.95; // -5%
  if (energy >= 40) return 0.90; // -10%
  return 0.80; // -20%
}

/**
 * Check if medical evacuation is needed
 */
export function needsMedicalEvac(stats: PlayerStats): boolean {
  const total = stats.hunger + stats.thirst + stats.comfort;
  return total <= 50; // Total stats ≤ 50 = medical alert
}

/**
 * Apply stat decay for a new day
 */
export function applyDailyStatDecay(
  currentStats: PlayerStats,
  decayMultiplier: number = 1.0
): PlayerStats {
  return {
    hunger: Math.max(0, currentStats.hunger - 15 * decayMultiplier),
    thirst: Math.max(0, currentStats.thirst - 20 * decayMultiplier),
    comfort: Math.max(0, currentStats.comfort - 10 * decayMultiplier),
    energy: 0, // Will be recalculated
  };
}
