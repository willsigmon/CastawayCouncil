// Random Events System for Castaway Council
// Dynamic twists that keep gameplay unpredictable

export type RandomEventType =
  | 'injury'
  | 'animal_encounter'
  | 'lost_supplies'
  | 'mysterious_clue'
  | 'supply_drop'
  | 'tribal_visit'
  | 'food_spoilage';

export type TargetType = 'player' | 'tribe';

export interface RandomEvent {
  eventType: RandomEventType;
  targetType: TargetType;
  description: string;
  effects: EventEffects;
}

export interface EventEffects {
  statChanges?: {
    hunger?: number;
    thirst?: number;
    comfort?: number;
    energy?: number;
  };
  itemChanges?: {
    item: string;
    quantity: number; // Negative for loss, positive for gain
  }[];
  advantageGrant?: boolean;
  missionGrant?: boolean;
  duration?: number; // Days the effect lasts
  metadata?: Record<string, any>;
}

interface EventDefinition {
  type: RandomEventType;
  probability: number; // Base probability per day (%)
  targetType: TargetType;
  severityLevels: {
    mild: EventEffects;
    moderate: EventEffects;
    severe: EventEffects;
  };
  descriptions: {
    mild: string;
    moderate: string;
    severe: string;
  };
}

const eventDefinitions: Record<RandomEventType, EventDefinition> = {
  injury: {
    type: 'injury',
    probability: 5,
    targetType: 'player',
    severityLevels: {
      mild: {
        statChanges: { comfort: -10, energy: -5 },
        duration: 1,
      },
      moderate: {
        statChanges: { comfort: -20, energy: -15, hunger: -5 },
        duration: 2,
      },
      severe: {
        statChanges: { comfort: -30, energy: -25, hunger: -10 },
        duration: 3,
        metadata: { medicalRisk: true },
      },
    },
    descriptions: {
      mild: 'Minor injury while gathering. Bruised but manageable.',
      moderate: 'Sprained ankle while exploring. Movement is painful.',
      severe: 'Serious injury from falling! Significant pain and limited mobility.',
    },
  },

  animal_encounter: {
    type: 'animal_encounter',
    probability: 8,
    targetType: 'player',
    severityLevels: {
      mild: {
        statChanges: { comfort: -5 },
        itemChanges: [{ item: 'fish', quantity: 1 }],
      },
      moderate: {
        statChanges: { comfort: -15, hunger: -10 },
        itemChanges: [{ item: 'coconut', quantity: -2 }],
      },
      severe: {
        statChanges: { comfort: -25, energy: -20 },
        itemChanges: [
          { item: 'fish', quantity: -3 },
          { item: 'coconut', quantity: -2 },
        ],
      },
    },
    descriptions: {
      mild: 'Friendly dolphin spotted! Followed it to find fish.',
      moderate: 'Monkeys raided camp and stole coconuts! Chase them off.',
      severe: 'Wild boar charged through camp! Scattered supplies and caused chaos.',
    },
  },

  lost_supplies: {
    type: 'lost_supplies',
    probability: 4,
    targetType: 'tribe',
    severityLevels: {
      mild: {
        itemChanges: [{ item: 'firewood', quantity: -2 }],
      },
      moderate: {
        itemChanges: [
          { item: 'firewood', quantity: -3 },
          { item: 'coconut', quantity: -2 },
        ],
      },
      severe: {
        itemChanges: [
          { item: 'firewood', quantity: -5 },
          { item: 'coconut', quantity: -3 },
          { item: 'fish', quantity: -2 },
        ],
      },
    },
    descriptions: {
      mild: 'High tide washed away some firewood. Secure your supplies!',
      moderate: 'Overnight rain soaked and ruined some stored food and wood.',
      severe: 'Major storm surge! Significant supplies lost to the ocean.',
    },
  },

  mysterious_clue: {
    type: 'mysterious_clue',
    probability: 6,
    targetType: 'player',
    severityLevels: {
      mild: {
        statChanges: { comfort: 5 },
        metadata: { clueType: 'map_hint' },
      },
      moderate: {
        statChanges: { comfort: 10 },
        missionGrant: true,
        metadata: { clueType: 'advantage_location' },
      },
      severe: {
        statChanges: { comfort: 15 },
        advantageGrant: true,
        metadata: { clueType: 'advantage_found' },
      },
    },
    descriptions: {
      mild: 'Found a mysterious bottle with a cryptic message inside.',
      moderate: 'Discovered an old map washed ashore with markings. Could lead to an advantage!',
      severe: 'Uncovered a hidden advantage while following mysterious footprints!',
    },
  },

  supply_drop: {
    type: 'supply_drop',
    probability: 3,
    targetType: 'tribe',
    severityLevels: {
      mild: {
        itemChanges: [
          { item: 'coconut', quantity: 3 },
          { item: 'firewood', quantity: 2 },
        ],
      },
      moderate: {
        itemChanges: [
          { item: 'coconut', quantity: 5 },
          { item: 'firewood', quantity: 4 },
          { item: 'fish', quantity: 2 },
        ],
      },
      severe: {
        itemChanges: [
          { item: 'coconut', quantity: 8 },
          { item: 'firewood', quantity: 6 },
          { item: 'fish', quantity: 4 },
        ],
        advantageGrant: true,
      },
    },
    descriptions: {
      mild: 'Small care package washed ashore! Some basic supplies.',
      moderate: 'Supply drop from a passing boat! Generous provisions.',
      severe: 'MAJOR supply drop! The producers are feeling generous. Includes hidden advantage!',
    },
  },

  tribal_visit: {
    type: 'tribal_visit',
    probability: 2,
    targetType: 'tribe',
    severityLevels: {
      mild: {
        statChanges: { comfort: 10, hunger: 5 },
        metadata: { visitType: 'local_fishermen' },
      },
      moderate: {
        statChanges: { comfort: 20, hunger: 10, thirst: 10 },
        itemChanges: [{ item: 'fish', quantity: 3 }],
        metadata: { visitType: 'tribal_feast' },
      },
      severe: {
        statChanges: { comfort: 30, hunger: 20, thirst: 15 },
        itemChanges: [
          { item: 'fish', quantity: 5 },
          { item: 'coconut', quantity: 3 },
        ],
        missionGrant: true,
        metadata: { visitType: 'tribal_alliance' },
      },
    },
    descriptions: {
      mild: 'Local fishermen stopped by and shared fishing tips.',
      moderate: 'Invited to a nearby tribal feast! Received food and cultural wisdom.',
      severe: 'Formed alliance with local tribe! Major food gift and special mission opportunity.',
    },
  },

  food_spoilage: {
    type: 'food_spoilage',
    probability: 5,
    targetType: 'tribe',
    severityLevels: {
      mild: {
        itemChanges: [{ item: 'fish', quantity: -1 }],
      },
      moderate: {
        itemChanges: [
          { item: 'fish', quantity: -2 },
          { item: 'coconut', quantity: -1 },
        ],
      },
      severe: {
        itemChanges: [
          { item: 'fish', quantity: -4 },
          { item: 'coconut', quantity: -3 },
        ],
        statChanges: { comfort: -10 },
      },
    },
    descriptions: {
      mild: 'Some fish spoiled in the heat. Better storage needed.',
      moderate: 'Multiple food items went bad. The heat is relentless.',
      severe: 'Major food spoilage event! Ants invaded and contaminated supplies.',
    },
  },
};

/**
 * Determine if a random event should occur
 */
export function shouldTriggerRandomEvent(day: number): boolean {
  // Higher chance in late game
  const baseChance = day <= 5 ? 15 : day <= 10 ? 25 : 35;
  return Math.random() * 100 < baseChance;
}

/**
 * Generate a random event
 */
export function generateRandomEvent(day: number): RandomEvent {
  // Calculate probabilities
  const totalProbability = Object.values(eventDefinitions).reduce(
    (sum, def) => sum + def.probability,
    0
  );

  // Roll for event type
  const roll = Math.random() * totalProbability;
  let cumulative = 0;
  let selectedEvent: EventDefinition | null = null;

  for (const definition of Object.values(eventDefinitions)) {
    cumulative += definition.probability;
    if (roll <= cumulative) {
      selectedEvent = definition;
      break;
    }
  }

  if (!selectedEvent) {
    selectedEvent = eventDefinitions.mysterious_clue;
  }

  // Determine severity (late game = more severe)
  let severity: 'mild' | 'moderate' | 'severe' = 'mild';
  const severityRoll = Math.random() * 100;

  if (day <= 5) {
    // Early: 70% mild, 25% moderate, 5% severe
    if (severityRoll > 95) severity = 'severe';
    else if (severityRoll > 70) severity = 'moderate';
  } else if (day <= 10) {
    // Mid: 50% mild, 35% moderate, 15% severe
    if (severityRoll > 85) severity = 'severe';
    else if (severityRoll > 50) severity = 'moderate';
  } else {
    // Late: 30% mild, 40% moderate, 30% severe
    if (severityRoll > 70) severity = 'severe';
    else if (severityRoll > 30) severity = 'moderate';
  }

  return {
    eventType: selectedEvent.type,
    targetType: selectedEvent.targetType,
    description: selectedEvent.descriptions[severity],
    effects: selectedEvent.severityLevels[severity],
  };
}

/**
 * Apply event effects to player stats
 */
export function applyEventEffects(
  currentStats: { hunger: number; thirst: number; comfort: number; energy: number },
  effects: EventEffects
): { hunger: number; thirst: number; comfort: number; energy: number } {
  let { hunger, thirst, comfort, energy } = currentStats;

  if (effects.statChanges) {
    if (effects.statChanges.hunger) hunger = Math.max(0, Math.min(100, hunger + effects.statChanges.hunger));
    if (effects.statChanges.thirst) thirst = Math.max(0, Math.min(100, thirst + effects.statChanges.thirst));
    if (effects.statChanges.comfort) comfort = Math.max(0, Math.min(100, comfort + effects.statChanges.comfort));
    if (effects.statChanges.energy) energy = Math.max(0, Math.min(100, energy + effects.statChanges.energy));
  }

  return { hunger, thirst, comfort, energy };
}

/**
 * Get icon for event type
 */
export function getEventIcon(eventType: RandomEventType): string {
  const icons: Record<RandomEventType, string> = {
    injury: '🤕',
    animal_encounter: '🐗',
    lost_supplies: '🌊',
    mysterious_clue: '🗺️',
    supply_drop: '📦',
    tribal_visit: '🏝️',
    food_spoilage: '🦟',
  };
  return icons[eventType];
}

/**
 * Get color class for event type
 */
export function getEventColor(eventType: RandomEventType): string {
  const colors: Record<RandomEventType, string> = {
    injury: 'from-red-500 to-red-700',
    animal_encounter: 'from-orange-500 to-amber-700',
    lost_supplies: 'from-blue-500 to-blue-700',
    mysterious_clue: 'from-purple-500 to-indigo-700',
    supply_drop: 'from-green-500 to-emerald-700',
    tribal_visit: 'from-teal-500 to-cyan-700',
    food_spoilage: 'from-yellow-600 to-orange-700',
  };
  return colors[eventType];
}
