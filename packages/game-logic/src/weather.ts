// Weather System for Castaway Council
// Random daily weather affects player stats

export type WeatherType = 'sunny' | 'rain' | 'heat' | 'storm' | 'cold';
export type WeatherSeverity = 1 | 2 | 3; // mild, moderate, severe

export interface WeatherEvent {
  weatherType: WeatherType;
  severity: WeatherSeverity;
  hungerModifier: number;
  thirstModifier: number;
  comfortModifier: number;
  description: string;
}

export interface WeatherEffects {
  hungerModifier: number;
  thirstModifier: number;
  comfortModifier: number;
  canPrevent: boolean; // Can camp upgrades prevent/reduce these effects?
}

// Weather configurations by type and severity
const weatherConfigs: Record<WeatherType, Record<WeatherSeverity, WeatherEffects>> = {
  sunny: {
    1: { hungerModifier: 0, thirstModifier: -5, comfortModifier: 5, canPrevent: false },
    2: { hungerModifier: 0, thirstModifier: -10, comfortModifier: 10, canPrevent: false },
    3: { hungerModifier: 0, thirstModifier: -15, comfortModifier: 15, canPrevent: false },
  },
  rain: {
    1: { hungerModifier: 0, thirstModifier: 10, comfortModifier: -10, canPrevent: true },
    2: { hungerModifier: -5, thirstModifier: 15, comfortModifier: -15, canPrevent: true },
    3: { hungerModifier: -10, thirstModifier: 20, comfortModifier: -20, canPrevent: true },
  },
  heat: {
    1: { hungerModifier: -5, thirstModifier: -10, comfortModifier: -5, canPrevent: true },
    2: { hungerModifier: -10, thirstModifier: -15, comfortModifier: -10, canPrevent: true },
    3: { hungerModifier: -15, thirstModifier: -25, comfortModifier: -15, canPrevent: true },
  },
  storm: {
    1: { hungerModifier: -5, thirstModifier: 0, comfortModifier: -15, canPrevent: true },
    2: { hungerModifier: -10, thirstModifier: 0, comfortModifier: -25, canPrevent: true },
    3: { hungerModifier: -15, thirstModifier: 0, comfortModifier: -35, canPrevent: true },
  },
  cold: {
    1: { hungerModifier: -10, thirstModifier: 0, comfortModifier: -10, canPrevent: true },
    2: { hungerModifier: -15, thirstModifier: 0, comfortModifier: -20, canPrevent: true },
    3: { hungerModifier: -20, thirstModifier: 0, comfortModifier: -30, canPrevent: true },
  },
};

const weatherDescriptions: Record<WeatherType, Record<WeatherSeverity, string>> = {
  sunny: {
    1: 'Clear skies and warm sunshine. Great day for gathering!',
    2: 'Hot and sunny. Remember to stay hydrated.',
    3: 'Scorching heat and relentless sun. Seek shade when possible.',
  },
  rain: {
    1: 'Light drizzle. Free water, but everything is damp.',
    2: 'Steady rainfall. Good for water collection, rough on morale.',
    3: 'Heavy downpour. Shelter is essential.',
  },
  heat: {
    1: 'Humid and warm. Water is crucial.',
    2: 'Oppressive heat. Energy-draining conditions.',
    3: 'Extreme heat wave! Dangerous without proper shelter and water.',
  },
  storm: {
    1: 'Windy with occasional gusts. Secure your camp.',
    2: 'Strong storm approaching. Take cover!',
    3: 'Violent tropical storm! Shelter and supplies at risk.',
  },
  cold: {
    1: 'Cool evening breeze. Fire helps.',
    2: 'Cold snap. Fire and warm clothes needed.',
    3: 'Freezing temperatures! Fire is essential for survival.',
  },
};

// Weather probabilities by day (early game vs late game)
interface WeatherProbabilities {
  sunny: number;
  rain: number;
  heat: number;
  storm: number;
  cold: number;
}

function getWeatherProbabilities(day: number): WeatherProbabilities {
  // Early game (days 1-5): more mild weather
  if (day <= 5) {
    return { sunny: 50, rain: 25, heat: 15, storm: 5, cold: 5 };
  }
  // Mid game (days 6-10): balanced
  if (day <= 10) {
    return { sunny: 35, rain: 25, heat: 20, storm: 10, cold: 10 };
  }
  // Late game (days 11+): more extreme
  return { sunny: 25, rain: 20, heat: 25, storm: 15, cold: 15 };
}

/**
 * Generate random weather for a given day
 */
export function generateDailyWeather(day: number): WeatherEvent {
  const probs = getWeatherProbabilities(day);

  // Roll for weather type
  const roll = Math.random() * 100;
  let cumulative = 0;
  let weatherType: WeatherType = 'sunny';

  for (const [type, prob] of Object.entries(probs)) {
    cumulative += prob;
    if (roll <= cumulative) {
      weatherType = type as WeatherType;
      break;
    }
  }

  // Roll for severity (late game has higher chance of severe)
  const severityRoll = Math.random() * 100;
  let severity: WeatherSeverity = 1;

  if (day <= 5) {
    // Early: 70% mild, 25% moderate, 5% severe
    if (severityRoll > 95) severity = 3;
    else if (severityRoll > 70) severity = 2;
  } else if (day <= 10) {
    // Mid: 50% mild, 35% moderate, 15% severe
    if (severityRoll > 85) severity = 3;
    else if (severityRoll > 50) severity = 2;
  } else {
    // Late: 30% mild, 45% moderate, 25% severe
    if (severityRoll > 75) severity = 3;
    else if (severityRoll > 30) severity = 2;
  }

  const effects = weatherConfigs[weatherType][severity];
  const description = weatherDescriptions[weatherType][severity];

  return {
    weatherType,
    severity,
    hungerModifier: effects.hungerModifier,
    thirstModifier: effects.thirstModifier,
    comfortModifier: effects.comfortModifier,
    description,
  };
}

/**
 * Apply weather effects to player stats
 * Camp upgrades can reduce negative effects
 */
export function applyWeatherEffects(
  currentStats: { hunger: number; thirst: number; comfort: number },
  weather: WeatherEvent,
  hasShelter: boolean = false,
  hasFire: boolean = false
): { hunger: number; thirst: number; comfort: number } {
  let hungerMod = weather.hungerModifier;
  let thirstMod = weather.thirstModifier;
  let comfortMod = weather.comfortModifier;

  const effects = weatherConfigs[weather.weatherType][weather.severity];

  // Shelter reduces rain/storm comfort penalties by 50%
  if (hasShelter && (weather.weatherType === 'rain' || weather.weatherType === 'storm')) {
    comfortMod = Math.floor(comfortMod / 2);
  }

  // Fire reduces cold/heat effects by 50%
  if (hasFire && (weather.weatherType === 'cold' || weather.weatherType === 'heat')) {
    hungerMod = Math.floor(hungerMod / 2);
    comfortMod = Math.floor(comfortMod / 2);
  }

  return {
    hunger: Math.max(0, Math.min(100, currentStats.hunger + hungerMod)),
    thirst: Math.max(0, Math.min(100, currentStats.thirst + thirstMod)),
    comfort: Math.max(0, Math.min(100, currentStats.comfort + comfortMod)),
  };
}

/**
 * Get warning message if severe weather is coming
 */
export function getWeatherWarning(weather: WeatherEvent): string | null {
  if (weather.severity === 3) {
    switch (weather.weatherType) {
      case 'storm':
        return '⚠️ SEVERE STORM WARNING: Build shelter and secure supplies!';
      case 'heat':
        return '🌡️ EXTREME HEAT WARNING: Gather water immediately!';
      case 'cold':
        return '❄️ FREEZE WARNING: Build fire and find shelter!';
      case 'rain':
        return '🌧️ HEAVY RAIN WARNING: Seek shelter to stay dry!';
      default:
        return null;
    }
  }
  return null;
}

/**
 * Calculate weather impact on action success rates
 */
export function getWeatherActionModifiers(weather: WeatherEvent): {
  gatheringModifier: number;
  fishingModifier: number;
  comfortActionsModifier: number;
} {
  const mods = {
    gatheringModifier: 0,
    fishingModifier: 0,
    comfortActionsModifier: 0,
  };

  switch (weather.weatherType) {
    case 'rain':
      mods.fishingModifier = weather.severity * 10; // Better fishing in rain
      mods.gatheringModifier = -weather.severity * 5; // Harder to gather in rain
      break;
    case 'storm':
      mods.gatheringModifier = -weather.severity * 10; // Much harder
      mods.fishingModifier = -weather.severity * 15; // Dangerous
      break;
    case 'heat':
      mods.gatheringModifier = -weather.severity * 5; // Exhausting
      mods.comfortActionsModifier = -weather.severity * 5; // Hard to rest in heat
      break;
    case 'cold':
      mods.comfortActionsModifier = weather.severity * 5; // Easier to rest/sleep
      mods.gatheringModifier = -weather.severity * 5; // Cold makes it harder
      break;
    case 'sunny':
      mods.gatheringModifier = weather.severity * 5; // Great for gathering
      break;
  }

  return mods;
}
