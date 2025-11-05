// Secret Missions System for Castaway Council
// Private objectives that grant bonuses when completed secretly

export type MissionType =
  | 'vote_for'
  | 'vote_against'
  | 'alliance_with'
  | 'avoid_player'
  | 'gather_resources'
  | 'win_challenge'
  | 'find_advantage'
  | 'build_upgrade'
  | 'help_player'
  | 'sabotage';

export type MissionStatus = 'assigned' | 'in_progress' | 'completed' | 'failed' | 'expired';

export interface SecretMission {
  id: string;
  playerId: string;
  title: string;
  description: string;
  objective: MissionObjective;
  reward: MissionReward;
  status: MissionStatus;
  expiresInDays: number;
  secretBonus?: number; // Extra reward if kept secret
}

export interface MissionObjective {
  type: MissionType;
  target?: string; // Player ID or resource name
  quantity?: number;
  condition?: string;
}

export interface MissionReward {
  statBonus?: {
    hunger?: number;
    thirst?: number;
    comfort?: number;
    energy?: number;
  };
  insightPoints?: number;
  advantage?: boolean;
  immunity?: boolean; // One-time protection
  extraVote?: boolean;
  influence?: number; // Hidden influence on jury
}

export interface MissionCheckResult {
  completed: boolean;
  progress: number; // 0-100%
  message?: string;
}

/**
 * Generate random secret mission
 */
export function generateSecretMission(
  playerId: string,
  day: number,
  context: {
    tribemates: string[];
    rivals: string[];
    currentAlliances: string[];
  }
): SecretMission {
  const missionTemplates: Array<{
    type: MissionType;
    weight: number;
    generator: (context: any) => Omit<SecretMission, 'id' | 'playerId' | 'status'>;
  }> = [
    {
      type: 'vote_for',
      weight: 15,
      generator: (ctx) => {
        const target = ctx.tribemates[Math.floor(Math.random() * ctx.tribemates.length)];
        return {
          title: 'Strategic Vote',
          description: `Convince your tribe to vote for ${target} at the next tribal council. Keep this objective secret for bonus rewards.`,
          objective: { type: 'vote_for', target },
          reward: {
            insightPoints: 10,
            influence: 2,
            statBonus: { comfort: 15 },
          },
          expiresInDays: 2,
          secretBonus: 5,
        };
      },
    },
    {
      type: 'alliance_with',
      weight: 12,
      generator: (ctx) => {
        const target = ctx.tribemates[Math.floor(Math.random() * ctx.tribemates.length)];
        return {
          title: 'Form Alliance',
          description: `Build trust and form an alliance with ${target}. Have at least 3 private conversations.`,
          objective: { type: 'alliance_with', target, quantity: 3 },
          reward: {
            insightPoints: 15,
            influence: 3,
            statBonus: { comfort: 20, energy: 10 },
          },
          expiresInDays: 3,
          secretBonus: 8,
        };
      },
    },
    {
      type: 'gather_resources',
      weight: 10,
      generator: () => {
        const resources = ['firewood', 'coconut', 'fish'];
        const resource = resources[Math.floor(Math.random() * resources.length)];
        const quantity = 5 + Math.floor(Math.random() * 5);
        return {
          title: 'Resource Gathering',
          description: `Gather ${quantity} ${resource} for the tribe without telling anyone it's a mission.`,
          objective: { type: 'gather_resources', target: resource, quantity },
          reward: {
            statBonus: { energy: 20, comfort: 10 },
            insightPoints: 8,
          },
          expiresInDays: 2,
          secretBonus: 5,
        };
      },
    },
    {
      type: 'find_advantage',
      weight: 8,
      generator: () => ({
        title: 'Advantage Hunt',
        description: 'Find a hidden advantage before anyone else. Keep it secret to maximize its value.',
        objective: { type: 'find_advantage' },
        reward: {
          advantage: true,
          insightPoints: 20,
          influence: 5,
        },
        expiresInDays: 3,
        secretBonus: 10,
      }),
    },
    {
      type: 'build_upgrade',
      weight: 10,
      generator: () => {
        const upgrades = ['shelter', 'fire', 'trap'];
        const upgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
        return {
          title: 'Camp Improvement',
          description: `Lead the effort to build or upgrade the tribe's ${upgrade}. Coordinate resources quietly.`,
          objective: { type: 'build_upgrade', target: upgrade },
          reward: {
            insightPoints: 12,
            statBonus: { comfort: 25, energy: 15 },
            influence: 2,
          },
          expiresInDays: 3,
          secretBonus: 7,
        };
      },
    },
    {
      type: 'help_player',
      weight: 12,
      generator: (ctx) => {
        const target = ctx.tribemates[Math.floor(Math.random() * ctx.tribemates.length)];
        return {
          title: 'Silent Guardian',
          description: `Secretly help ${target} improve their stats. Share resources or cover for them without revealing why.`,
          objective: { type: 'help_player', target, quantity: 3 },
          reward: {
            insightPoints: 10,
            influence: 4,
            statBonus: { comfort: 20 },
          },
          expiresInDays: 2,
          secretBonus: 8,
        };
      },
    },
    {
      type: 'win_challenge',
      weight: 8,
      generator: () => ({
        title: 'Prove Your Worth',
        description: 'Be a top performer in the next challenge. Victory proves your value to the tribe.',
        objective: { type: 'win_challenge' },
        reward: {
          insightPoints: 15,
          statBonus: { energy: 30, comfort: 20 },
          influence: 3,
        },
        expiresInDays: 1,
      }),
    },
    {
      type: 'avoid_player',
      weight: 7,
      generator: (ctx) => {
        const target = ctx.rivals[Math.floor(Math.random() * ctx.rivals.length)];
        return {
          title: 'Maintain Distance',
          description: `Avoid being alone with ${target}. They might be targeting you.`,
          objective: { type: 'avoid_player', target },
          reward: {
            insightPoints: 8,
            immunity: true, // One-time protection
            statBonus: { comfort: 15 },
          },
          expiresInDays: 2,
          secretBonus: 5,
        };
      },
    },
  ];

  // Weight-based selection
  const totalWeight = missionTemplates.reduce((sum, t) => sum + t.weight, 0);
  const roll = Math.random() * totalWeight;
  let cumulative = 0;

  for (const template of missionTemplates) {
    cumulative += template.weight;
    if (roll <= cumulative) {
      const mission = template.generator(context);
      return {
        ...mission,
        id: `mission_${playerId}_${day}_${Date.now()}`,
        playerId,
        status: 'assigned',
      };
    }
  }

  // Fallback
  const fallback = missionTemplates[0]!.generator(context);
  return {
    ...fallback,
    id: `mission_${playerId}_${day}_${Date.now()}`,
    playerId,
    status: 'assigned',
  };
}

/**
 * Check mission progress
 */
export function checkMissionProgress(
  mission: SecretMission,
  actions: {
    votedFor?: string;
    alliedWith?: string[];
    gatheredResources?: Record<string, number>;
    foundAdvantage?: boolean;
    builtUpgrade?: string;
    helpedPlayers?: string[];
    challengeWon?: boolean;
    encounteredPlayers?: string[];
  }
): MissionCheckResult {
  const { objective } = mission;

  switch (objective.type) {
    case 'vote_for':
      if (actions.votedFor === objective.target) {
        return {
          completed: true,
          progress: 100,
          message: 'Strategic vote objective completed!',
        };
      }
      return { completed: false, progress: 0 };

    case 'alliance_with':
      const allianceCount = actions.alliedWith?.filter(
        (p) => p === objective.target
      ).length || 0;
      const required = objective.quantity || 3;
      const progress = Math.min(100, (allianceCount / required) * 100);
      return {
        completed: allianceCount >= required,
        progress,
        message:
          allianceCount >= required
            ? 'Alliance formed successfully!'
            : `Alliance progress: ${allianceCount}/${required} interactions`,
      };

    case 'gather_resources':
      const gathered = actions.gatheredResources?.[objective.target!] || 0;
      const requiredAmount = objective.quantity || 5;
      const gatherProgress = Math.min(100, (gathered / requiredAmount) * 100);
      return {
        completed: gathered >= requiredAmount,
        progress: gatherProgress,
        message:
          gathered >= requiredAmount
            ? 'Resource gathering complete!'
            : `Gathered ${gathered}/${requiredAmount} ${objective.target}`,
      };

    case 'find_advantage':
      return {
        completed: actions.foundAdvantage || false,
        progress: actions.foundAdvantage ? 100 : 0,
        message: actions.foundAdvantage ? 'Advantage found!' : 'Keep searching...',
      };

    case 'build_upgrade':
      return {
        completed: actions.builtUpgrade === objective.target,
        progress: actions.builtUpgrade === objective.target ? 100 : 0,
        message:
          actions.builtUpgrade === objective.target
            ? 'Upgrade built successfully!'
            : 'Continue gathering resources...',
      };

    case 'help_player':
      const helpCount = actions.helpedPlayers?.filter(
        (p) => p === objective.target
      ).length || 0;
      const helpRequired = objective.quantity || 3;
      const helpProgress = Math.min(100, (helpCount / helpRequired) * 100);
      return {
        completed: helpCount >= helpRequired,
        progress: helpProgress,
        message:
          helpCount >= helpRequired
            ? 'Successfully helped player!'
            : `Helped ${helpCount}/${helpRequired} times`,
      };

    case 'win_challenge':
      return {
        completed: actions.challengeWon || false,
        progress: actions.challengeWon ? 100 : 0,
        message: actions.challengeWon
          ? 'Challenge won!'
          : 'Prepare for the challenge...',
      };

    case 'avoid_player':
      const encountered = actions.encounteredPlayers?.includes(objective.target!) || false;
      return {
        completed: !encountered,
        progress: encountered ? 0 : 100,
        message: encountered
          ? 'Failed to avoid player'
          : 'Successfully maintaining distance',
      };

    default:
      return { completed: false, progress: 0 };
  }
}

/**
 * Calculate mission rewards
 */
export function calculateMissionRewards(
  mission: SecretMission,
  keptSecret: boolean
): MissionReward {
  const baseReward = { ...mission.reward };

  if (keptSecret && mission.secretBonus) {
    // Add secret bonus
    if (baseReward.insightPoints) {
      baseReward.insightPoints += mission.secretBonus;
    }
    if (baseReward.influence) {
      baseReward.influence += Math.floor(mission.secretBonus / 2);
    }
  }

  return baseReward;
}

/**
 * Get mission icon
 */
export function getMissionIcon(missionType: MissionType): string {
  const icons: Record<MissionType, string> = {
    vote_for: '🗳️',
    vote_against: '🚫',
    alliance_with: '🤝',
    avoid_player: '🚶',
    gather_resources: '🌾',
    win_challenge: '🏆',
    find_advantage: '🔍',
    build_upgrade: '🏗️',
    help_player: '❤️',
    sabotage: '💣',
  };
  return icons[missionType];
}
