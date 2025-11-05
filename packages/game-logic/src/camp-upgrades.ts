// Camp Upgrades System for Castaway Council
// Tribes can spend resources to build structures that provide benefits

export type UpgradeType = 'shelter' | 'fire' | 'trap' | 'tool_station' | 'water_filter' | 'storage';

export interface UpgradeDefinition {
  type: UpgradeType;
  name: string;
  description: string;
  maxLevel: number;
  resourceCost: (level: number) => Record<string, number>;
  benefits: (level: number) => UpgradeBenefits;
}

export interface UpgradeBenefits {
  comfortBonus?: number;
  hungerBonus?: number;
  thirstBonus?: number;
  weatherProtection?: number; // Percentage reduction in negative weather effects
  findRateBonus?: number; // Bonus to advantage/resource finding
  fishingBonus?: number;
  gatheringBonus?: number;
  storageCapacity?: number; // Additional inventory slots
  craftingUnlock?: boolean;
}

export interface BuildUpgradeResult {
  success: boolean;
  message: string;
  upgrade?: {
    type: UpgradeType;
    level: number;
    benefits: UpgradeBenefits;
  };
  resourcesUsed?: Record<string, number>;
}

// Upgrade definitions
export const upgradeDefinitions: Record<UpgradeType, UpgradeDefinition> = {
  shelter: {
    type: 'shelter',
    name: 'Shelter',
    description: 'Protects from rain and storms, provides comfort bonus',
    maxLevel: 3,
    resourceCost: (level) => {
      switch (level) {
        case 1:
          return { firewood: 5, coconut: 0, fish: 0 };
        case 2:
          return { firewood: 10, coconut: 3, fish: 0 };
        case 3:
          return { firewood: 15, coconut: 5, fish: 5 };
        default:
          return {};
      }
    },
    benefits: (level) => ({
      comfortBonus: level * 10,
      weatherProtection: level * 25, // 25%, 50%, 75% protection
    }),
  },

  fire: {
    type: 'fire',
    name: 'Fire Pit',
    description: 'Provides warmth, cooking, and comfort',
    maxLevel: 3,
    resourceCost: (level) => {
      switch (level) {
        case 1:
          return { firewood: 3, coconut: 0, fish: 0 };
        case 2:
          return { firewood: 8, coconut: 0, fish: 0 };
        case 3:
          return { firewood: 15, coconut: 0, fish: 0 };
        default:
          return {};
      }
    },
    benefits: (level) => ({
      comfortBonus: level * 5,
      hungerBonus: level * 5, // Better cooking = more nutrition
      weatherProtection: level * 15, // Protection from cold
    }),
  },

  trap: {
    type: 'trap',
    name: 'Fishing Trap',
    description: 'Passively catches fish overnight',
    maxLevel: 2,
    resourceCost: (level) => {
      switch (level) {
        case 1:
          return { firewood: 3, coconut: 2, fish: 0 };
        case 2:
          return { firewood: 5, coconut: 5, fish: 3 };
        default:
          return {};
      }
    },
    benefits: (level) => ({
      fishingBonus: level * 20, // 20% or 40% better fishing
    }),
  },

  tool_station: {
    type: 'tool_station',
    name: 'Tool Crafting Station',
    description: 'Unlocks crafting and improves gathering',
    maxLevel: 2,
    resourceCost: (level) => {
      switch (level) {
        case 1:
          return { firewood: 5, coconut: 5, fish: 0 };
        case 2:
          return { firewood: 10, coconut: 8, fish: 5 };
        default:
          return {};
      }
    },
    benefits: (level) => ({
      craftingUnlock: true,
      gatheringBonus: level * 10,
      findRateBonus: level * 5,
    }),
  },

  water_filter: {
    type: 'water_filter',
    name: 'Water Filter',
    description: 'Provides clean water, prevents tainted water',
    maxLevel: 2,
    resourceCost: (level) => {
      switch (level) {
        case 1:
          return { firewood: 3, coconut: 5, fish: 0 };
        case 2:
          return { firewood: 5, coconut: 10, fish: 5 };
        default:
          return {};
      }
    },
    benefits: (level) => ({
      thirstBonus: level * 10, // Better hydration from clean water
    }),
  },

  storage: {
    type: 'storage',
    name: 'Storage Area',
    description: 'Increases tribe inventory capacity',
    maxLevel: 3,
    resourceCost: (level) => {
      switch (level) {
        case 1:
          return { firewood: 4, coconut: 3, fish: 0 };
        case 2:
          return { firewood: 8, coconut: 6, fish: 0 };
        case 3:
          return { firewood: 12, coconut: 10, fish: 5 };
        default:
          return {};
      }
    },
    benefits: (level) => ({
      storageCapacity: level * 20, // +20, +40, +60 slots
    }),
  },
};

/**
 * Check if tribe has enough resources to build an upgrade
 */
export function canAffordUpgrade(
  tribeInventory: Record<string, number>,
  upgradeType: UpgradeType,
  targetLevel: number
): { canAfford: boolean; missing: Record<string, number> } {
  const definition = upgradeDefinitions[upgradeType];
  const cost = definition.resourceCost(targetLevel);

  const missing: Record<string, number> = {};
  let canAfford = true;

  for (const [resource, required] of Object.entries(cost)) {
    const available = tribeInventory[resource] || 0;
    if (available < required) {
      canAfford = false;
      missing[resource] = required - available;
    }
  }

  return { canAfford, missing };
}

/**
 * Build a camp upgrade
 */
export function buildUpgrade(
  tribeInventory: Record<string, number>,
  upgradeType: UpgradeType,
  currentLevel: number
): BuildUpgradeResult {
  const definition = upgradeDefinitions[upgradeType];
  const targetLevel = currentLevel + 1;

  // Check if already at max level
  if (currentLevel >= definition.maxLevel) {
    return {
      success: false,
      message: `${definition.name} is already at max level (${definition.maxLevel})`,
    };
  }

  // Check if can afford
  const { canAfford, missing } = canAffordUpgrade(tribeInventory, upgradeType, targetLevel);
  if (!canAfford) {
    const missingItems = Object.entries(missing)
      .map(([item, count]) => `${count} ${item}`)
      .join(', ');
    return {
      success: false,
      message: `Not enough resources. Missing: ${missingItems}`,
    };
  }

  // Calculate costs and benefits
  const cost = definition.resourceCost(targetLevel);
  const benefits = definition.benefits(targetLevel);

  return {
    success: true,
    message: `Successfully built ${definition.name} Level ${targetLevel}!`,
    upgrade: {
      type: upgradeType,
      level: targetLevel,
      benefits,
    },
    resourcesUsed: cost,
  };
}

/**
 * Get all benefits from a tribe's upgrades
 */
export function getTotalUpgradeBenefits(
  upgrades: Array<{ type: UpgradeType; level: number }>
): UpgradeBenefits {
  const total: UpgradeBenefits = {
    comfortBonus: 0,
    hungerBonus: 0,
    thirstBonus: 0,
    weatherProtection: 0,
    findRateBonus: 0,
    fishingBonus: 0,
    gatheringBonus: 0,
    storageCapacity: 0,
    craftingUnlock: false,
  };

  for (const upgrade of upgrades) {
    const definition = upgradeDefinitions[upgrade.type];
    const benefits = definition.benefits(upgrade.level);

    if (benefits.comfortBonus) total.comfortBonus! += benefits.comfortBonus;
    if (benefits.hungerBonus) total.hungerBonus! += benefits.hungerBonus;
    if (benefits.thirstBonus) total.thirstBonus! += benefits.thirstBonus;
    if (benefits.weatherProtection) total.weatherProtection! += benefits.weatherProtection;
    if (benefits.findRateBonus) total.findRateBonus! += benefits.findRateBonus;
    if (benefits.fishingBonus) total.fishingBonus! += benefits.fishingBonus;
    if (benefits.gatheringBonus) total.gatheringBonus! += benefits.gatheringBonus;
    if (benefits.storageCapacity) total.storageCapacity! += benefits.storageCapacity;
    if (benefits.craftingUnlock) total.craftingUnlock = true;
  }

  return total;
}

/**
 * Apply upgrade benefits to weather effects
 */
export function applyUpgradesToWeatherEffects(
  weatherEffects: { hunger: number; thirst: number; comfort: number },
  upgrades: Array<{ type: UpgradeType; level: number }>
): { hunger: number; thirst: number; comfort: number } {
  const benefits = getTotalUpgradeBenefits(upgrades);
  const protection = (benefits.weatherProtection || 0) / 100;

  // Reduce negative effects by protection percentage
  let hungerEffect = weatherEffects.hunger;
  let thirstEffect = weatherEffects.thirst;
  let comfortEffect = weatherEffects.comfort;

  if (hungerEffect < 0) hungerEffect *= 1 - protection;
  if (thirstEffect < 0) thirstEffect *= 1 - protection;
  if (comfortEffect < 0) comfortEffect *= 1 - protection;

  return {
    hunger: Math.round(hungerEffect),
    thirst: Math.round(thirstEffect),
    comfort: Math.round(comfortEffect),
  };
}
