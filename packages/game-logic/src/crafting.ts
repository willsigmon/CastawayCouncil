// Crafting System for Castaway Council
// Combine resources to create advanced tools and items

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: Array<{ item: string; quantity: number }>;
  resultItem: string;
  resultQuantity: number;
  unlockCondition?: string;
  craftingTime?: number; // Minutes to craft
}

export interface CraftResult {
  success: boolean;
  message: string;
  resultItem?: string;
  resultQuantity?: number;
  ingredientsUsed?: Array<{ item: string; quantity: number }>;
}

// Pre-defined crafting recipes
export const craftingRecipes: CraftingRecipe[] = [
  {
    id: 'fishing_rod',
    name: 'Fishing Rod',
    description: 'A proper fishing rod improves catch rate significantly',
    ingredients: [
      { item: 'stick', quantity: 2 },
      { item: 'vine', quantity: 3 },
    ],
    resultItem: 'fishing_rod',
    resultQuantity: 1,
    unlockCondition: 'tool_station_level_1',
  },
  {
    id: 'improved_spear',
    name: 'Improved Spear',
    description: 'A sharpened spear with better accuracy',
    ingredients: [
      { item: 'spear', quantity: 1 },
      { item: 'stone', quantity: 2 },
      { item: 'vine', quantity: 1 },
    ],
    resultItem: 'improved_spear',
    resultQuantity: 1,
    unlockCondition: 'tool_station_level_1',
  },
  {
    id: 'water_container',
    name: 'Water Container',
    description: 'Store water for later use',
    ingredients: [
      { item: 'coconut', quantity: 2 },
      { item: 'vine', quantity: 2 },
    ],
    resultItem: 'water_container',
    resultQuantity: 1,
    unlockCondition: 'tool_station_level_1',
  },
  {
    id: 'shelter_mat',
    name: 'Shelter Mat',
    description: 'Comfortable mat for sleeping',
    ingredients: [
      { item: 'palm_frond', quantity: 5 },
      { item: 'vine', quantity: 3 },
    ],
    resultItem: 'shelter_mat',
    resultQuantity: 1,
    unlockCondition: 'tool_station_level_1',
  },
  {
    id: 'fire_starter',
    name: 'Fire Starter Kit',
    description: 'Reliable method to start fires',
    ingredients: [
      { item: 'stick', quantity: 3 },
      { item: 'dry_grass', quantity: 5 },
      { item: 'stone', quantity: 1 },
    ],
    resultItem: 'fire_starter',
    resultQuantity: 1,
    unlockCondition: 'tool_station_level_1',
  },
  {
    id: 'fishing_net',
    name: 'Fishing Net',
    description: 'Catch multiple fish at once',
    ingredients: [
      { item: 'vine', quantity: 10 },
      { item: 'stick', quantity: 4 },
    ],
    resultItem: 'fishing_net',
    resultQuantity: 1,
    unlockCondition: 'tool_station_level_2',
    craftingTime: 30,
  },
  {
    id: 'rain_collector',
    name: 'Rain Collector',
    description: 'Automatically collects rain water',
    ingredients: [
      { item: 'coconut', quantity: 3 },
      { item: 'palm_frond', quantity: 4 },
      { item: 'vine', quantity: 2 },
    ],
    resultItem: 'rain_collector',
    resultQuantity: 1,
    unlockCondition: 'tool_station_level_2',
    craftingTime: 20,
  },
  {
    id: 'signal_fire',
    name: 'Signal Fire',
    description: 'Large fire visible from distance - might attract help',
    ingredients: [
      { item: 'firewood', quantity: 10 },
      { item: 'palm_frond', quantity: 5 },
      { item: 'coconut_oil', quantity: 2 },
    ],
    resultItem: 'signal_fire',
    resultQuantity: 1,
    unlockCondition: 'tool_station_level_2',
    craftingTime: 15,
  },
  {
    id: 'advanced_shelter',
    name: 'Advanced Shelter Components',
    description: 'Upgrade materials for better shelter',
    ingredients: [
      { item: 'firewood', quantity: 8 },
      { item: 'palm_frond', quantity: 10 },
      { item: 'vine', quantity: 6 },
      { item: 'stone', quantity: 4 },
    ],
    resultItem: 'shelter_upgrade',
    resultQuantity: 1,
    unlockCondition: 'tool_station_level_2',
    craftingTime: 45,
  },
  {
    id: 'coconut_oil',
    name: 'Coconut Oil',
    description: 'Multi-purpose oil for cooking and crafting',
    ingredients: [
      { item: 'coconut', quantity: 4 },
      { item: 'firewood', quantity: 2 },
    ],
    resultItem: 'coconut_oil',
    resultQuantity: 2,
    unlockCondition: 'fire_level_2',
    craftingTime: 10,
  },
];

/**
 * Check if player has ingredients to craft
 */
export function canCraft(
  recipe: CraftingRecipe,
  playerInventory: Record<string, number>,
  tribeInventory: Record<string, number>
): { canCraft: boolean; missing: Array<{ item: string; quantity: number }> } {
  const missing: Array<{ item: string; quantity: number }> = [];
  let canCraft = true;

  for (const ingredient of recipe.ingredients) {
    const playerHas = playerInventory[ingredient.item] || 0;
    const tribeHas = tribeInventory[ingredient.item] || 0;
    const totalAvailable = playerHas + tribeHas;

    if (totalAvailable < ingredient.quantity) {
      canCraft = false;
      missing.push({
        item: ingredient.item,
        quantity: ingredient.quantity - totalAvailable,
      });
    }
  }

  return { canCraft, missing };
}

/**
 * Craft an item
 */
export function craftItem(
  recipe: CraftingRecipe,
  playerInventory: Record<string, number>,
  tribeInventory: Record<string, number>
): CraftResult {
  const { canCraft, missing } = canCraft(recipe, playerInventory, tribeInventory);

  if (!canCraft) {
    const missingItems = missing
      .map((m) => `${m.quantity} ${m.item}`)
      .join(', ');
    return {
      success: false,
      message: `Cannot craft ${recipe.name}. Missing: ${missingItems}`,
    };
  }

  // Track what was consumed
  const ingredientsUsed = recipe.ingredients.map((ing) => ({ ...ing }));

  return {
    success: true,
    message: `Successfully crafted ${recipe.name}!`,
    resultItem: recipe.resultItem,
    resultQuantity: recipe.resultQuantity,
    ingredientsUsed,
  };
}

/**
 * Get recipes available to player based on unlocks
 */
export function getAvailableRecipes(unlockedConditions: string[]): CraftingRecipe[] {
  return craftingRecipes.filter((recipe) => {
    if (!recipe.unlockCondition) return true;
    return unlockedConditions.includes(recipe.unlockCondition);
  });
}

/**
 * Get crafting bonus from items
 */
export function getCraftingBonus(craftedItem: string): {
  fishingBonus?: number;
  gatheringBonus?: number;
  comfortBonus?: number;
  thirstBonus?: number;
  waterSafety?: boolean;
} {
  const bonuses: Record<
    string,
    {
      fishingBonus?: number;
      gatheringBonus?: number;
      comfortBonus?: number;
      thirstBonus?: number;
      waterSafety?: boolean;
    }
  > = {
    fishing_rod: { fishingBonus: 25 },
    improved_spear: { fishingBonus: 35 },
    fishing_net: { fishingBonus: 50 },
    water_container: { thirstBonus: 10 },
    shelter_mat: { comfortBonus: 15 },
    rain_collector: { thirstBonus: 20, waterSafety: true },
    shelter_upgrade: { comfortBonus: 25 },
  };

  return bonuses[craftedItem] || {};
}

/**
 * Get item icon
 */
export function getCraftingItemIcon(item: string): string {
  const icons: Record<string, string> = {
    stick: '🪵',
    vine: '🌿',
    stone: '🪨',
    palm_frond: '🌴',
    dry_grass: '🌾',
    coconut_oil: '🥥',
    fishing_rod: '🎣',
    improved_spear: '🔱',
    water_container: '🏺',
    shelter_mat: '🛏️',
    fire_starter: '🔥',
    fishing_net: '🕸️',
    rain_collector: '☔',
    signal_fire: '🔥',
    shelter_upgrade: '🏠',
  };
  return icons[item] || '📦';
}

/**
 * Estimate crafting time based on recipe complexity
 */
export function estimateCraftingTime(recipe: CraftingRecipe): number {
  if (recipe.craftingTime) return recipe.craftingTime;

  // Estimate based on ingredient count
  const ingredientCount = recipe.ingredients.reduce(
    (sum, ing) => sum + ing.quantity,
    0
  );
  return Math.max(5, ingredientCount * 2);
}
