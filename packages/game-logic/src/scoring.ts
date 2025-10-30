import { z } from 'zod';

/**
 * Challenge scoring with modifiers from stats, items, and debuffs
 */

export const ModifierSchema = z.object({
  energy: z.number().int().default(0),
  hunger: z.number().int().default(0),
  thirst: z.number().int().default(0),
  itemBonus: z.number().int().default(0),
  eventBonus: z.number().int().default(0),
  debuffs: z.array(z.string()).default([]),
});

export type Modifier = z.infer<typeof ModifierSchema>;

export interface PlayerStats {
  energy: number;
  hunger: number;
  thirst: number;
  social: number;
}

export interface ChallengeScore {
  roll: number;
  modifiers: Modifier;
  total: number;
  breakdown: string[];
}

/**
 * Calculate stat-based modifiers
 * Energy bonus: floor(energy / 20) = 0-5 bonus
 */
export function calculateStatModifiers(stats: PlayerStats): Pick<Modifier, 'energy' | 'hunger' | 'thirst'> {
  return {
    energy: Math.floor(stats.energy / 20),
    hunger: stats.hunger < 30 ? -2 : 0, // Penalty if starving
    thirst: stats.thirst < 30 ? -2 : 0, // Penalty if dehydrated
  };
}

/**
 * Apply debuff modifiers
 */
export function applyDebuffs(debuffs: string[]): number {
  let penalty = 0;

  for (const debuff of debuffs) {
    switch (debuff) {
      case 'tainted_water':
        penalty -= 1;
        break;
      case 'exhausted':
        penalty -= 2;
        break;
      case 'injured':
        penalty -= 3;
        break;
      default:
        break;
    }
  }

  return penalty;
}

/**
 * Calculate final challenge score
 */
export function calculateScore(roll: number, stats: PlayerStats, modifier: Modifier): ChallengeScore {
  const breakdown: string[] = [];
  breakdown.push(`Base roll: ${roll}`);

  const statMods = calculateStatModifiers(stats);
  let total = roll;

  if (statMods.energy > 0) {
    breakdown.push(`Energy bonus: +${statMods.energy}`);
    total += statMods.energy;
  }

  if (statMods.hunger < 0) {
    breakdown.push(`Hunger penalty: ${statMods.hunger}`);
    total += statMods.hunger;
  }

  if (statMods.thirst < 0) {
    breakdown.push(`Thirst penalty: ${statMods.thirst}`);
    total += statMods.thirst;
  }

  if (modifier.itemBonus > 0) {
    breakdown.push(`Item bonus: +${modifier.itemBonus}`);
    total += modifier.itemBonus;
  }

  if (modifier.eventBonus !== 0) {
    breakdown.push(`Event modifier: ${modifier.eventBonus > 0 ? '+' : ''}${modifier.eventBonus}`);
    total += modifier.eventBonus;
  }

  const debuffPenalty = applyDebuffs(modifier.debuffs);
  if (debuffPenalty < 0) {
    breakdown.push(`Debuffs: ${debuffPenalty}`);
    total += debuffPenalty;
  }

  // Minimum score of 1
  total = Math.max(1, total);

  return {
    roll,
    modifiers: {
      ...statMods,
      itemBonus: modifier.itemBonus,
      eventBonus: modifier.eventBonus,
      debuffs: modifier.debuffs,
    },
    total,
    breakdown,
  };
}

/**
 * Calculate team score (sum of top K rolls)
 */
export function calculateTeamScore(
  individualScores: ChallengeScore[],
  topK: number
): { total: number; contributors: number[] } {
  const sorted = [...individualScores].sort((a, b) => b.total - a.total);
  const topScores = sorted.slice(0, topK);
  const total = topScores.reduce((sum, score) => sum + score.total, 0);
  const contributors = topScores.map((score) => score.total);

  return { total, contributors };
}

/**
 * Determine winner from team scores
 * Returns winning team index or -1 for tie
 */
export function determineWinner(teamScores: number[]): number {
  if (teamScores.length === 0) return -1;

  const maxScore = Math.max(...teamScores);
  const winners = teamScores.filter((score) => score === maxScore);

  // Tie if multiple teams have max score
  if (winners.length > 1) return -1;

  return teamScores.indexOf(maxScore);
}
