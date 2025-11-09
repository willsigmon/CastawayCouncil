/**
 * Narrative generation for player actions
 * Generates story outcomes based on action type, success level, and character archetype
 */

import type { ArchetypeId as CharacterArchetype } from "./characters";

export type SuccessLevel = "critical_success" | "success" | "partial" | "failure" | "critical_failure";

interface NarrativeTemplate {
  critical_success: string[];
  success: string[];
  partial: string[];
  failure: string[];
  critical_failure: string[];
}

// Narrative templates for each action type
const FORAGE_NARRATIVES: NarrativeTemplate = {
  critical_success: [
    "{name} discovered a hidden cache of wild berries and edible roots! The bounty will feed them for days.",
    "{name} stumbled upon a fruit-laden tree and gathered an incredible haul of fresh produce.",
    "{name} found a pristine patch of edible plants, skillfully identifying the most nutritious specimens.",
  ],
  success: [
    "{name} spent hours foraging and returned with a decent collection of berries and nuts.",
    "{name} gathered some wild fruits and roots from the jungle floor.",
    "{name} managed to find enough edible plants to stave off hunger.",
  ],
  partial: [
    "{name} searched for food but only found a few small berries and questionable mushrooms.",
    "{name} foraged for hours with little to show - just a handful of bitter nuts.",
    "{name} returned from foraging with meager results, exhausted and still hungry.",
  ],
  failure: [
    "{name} wandered through the jungle but couldn't identify any safe edible plants.",
    "{name} searched desperately but found nothing but poisonous berries and dead vegetation.",
    "{name} returned empty-handed, having wasted precious energy on a fruitless search.",
  ],
  critical_failure: [
    "{name} ate some suspicious berries while foraging and immediately regretted it. They feel ill.",
    "{name} got lost while foraging and barely made it back to camp, drained and demoralized.",
    "{name} disturbed a nest of angry insects while searching for food and got stung multiple times.",
  ],
};

const FISH_NARRATIVES: NarrativeTemplate = {
  critical_success: [
    "{name} speared a massive fish on their first try! The catch will feed the whole tribe.",
    "{name} crafted an ingenious fish trap and caught multiple fish effortlessly.",
    "{name} demonstrated expert fishing skills, landing several good-sized catches.",
  ],
  success: [
    "{name} patiently waited and managed to catch a decent-sized fish.",
    "{name} speared a fish after several attempts. Not huge, but enough for a meal.",
    "{name} successfully brought in a fish using their makeshift fishing gear.",
  ],
  partial: [
    "{name} almost caught a little fish, but it managed to slip away at the last second.",
    "{name} spent hours fishing but only caught a tiny minnow, barely worth the effort.",
    "{name} hooked a fish but it broke free, leaving them frustrated and hungry.",
  ],
  failure: [
    "{name} tried fishing but the fish weren't biting today. Not even a nibble.",
    "{name} stood in the water for hours but couldn't catch a single fish.",
    "{name} lost their fishing spear in the water and came back empty-handed.",
  ],
  critical_failure: [
    "{name} slipped on wet rocks while fishing and took a hard fall, bruising badly.",
    "{name} got stung by a venomous fish and had to abandon the attempt in pain.",
    "{name} spent so long fishing in the sun they became severely dehydrated and dizzy.",
  ],
};

const WATER_NARRATIVES: NarrativeTemplate = {
  critical_success: [
    "{name} discovered a pristine freshwater spring with crystal-clear, delicious water!",
    "{name} found a way to purify large quantities of water efficiently.",
    "{name} located a clean water source that will serve the tribe for days.",
  ],
  success: [
    "{name} collected fresh water from the stream and boiled it properly.",
    "{name} gathered clean water and filtered it through layers of sand and charcoal.",
    "{name} successfully replenished their water supply from a reliable source.",
  ],
  partial: [
    "{name} found some water but it looks a bit murky. Better than nothing.",
    "{name} collected water but had to settle for a questionable source.",
    "{name} got some water, though they're not entirely confident it's clean.",
  ],
  failure: [
    "{name} searched for water but all the nearby sources had dried up.",
    "{name} found a water source but it was completely contaminated and unusable.",
    "{name} couldn't locate any safe drinking water despite searching for hours.",
  ],
  critical_failure: [
    "{name} desperately drank from a stagnant pool and immediately felt nauseous. Bad call.",
    "{name} collapsed from dehydration while searching for water.",
    "{name} disturbed a snake while reaching for water and got bitten!",
  ],
};

const REST_NARRATIVES: NarrativeTemplate = {
  critical_success: [
    "{name} found the perfect shaded spot and enjoyed the most restful sleep they've had in days.",
    "{name} napped peacefully and woke up feeling completely refreshed and energized.",
    "{name} took a strategic rest break and recovered their full strength.",
  ],
  success: [
    "{name} lay down in the shade and got some much-needed rest.",
    "{name} took a solid nap and woke up feeling noticeably better.",
    "{name} rested for a while and recovered some energy.",
  ],
  partial: [
    "{name} tried to rest but the heat and bugs kept them from sleeping well.",
    "{name} dozed fitfully, getting only marginal recovery.",
    "{name} rested but anxiety kept them from truly relaxing.",
  ],
  failure: [
    "{name} lay down to rest but couldn't fall asleep despite exhaustion.",
    "{name} tried to nap but was constantly disturbed by camp activity.",
    "{name} spent time resting but felt just as tired afterward.",
  ],
  critical_failure: [
    "{name} fell asleep in direct sunlight and woke up with severe heat exhaustion.",
    "{name} passed out from exhaustion and no one checked on them for hours.",
    "{name} tried to rest but nightmares of elimination kept them from any real sleep.",
  ],
};

const HELP_NARRATIVES: NarrativeTemplate = {
  critical_success: [
    "{name} helped {target} with incredible generosity, strengthening their bond significantly.",
    "{name} went above and beyond to assist {target}, earning lasting gratitude and trust.",
    "{name} and {target} worked together beautifully, forming a powerful alliance.",
  ],
  success: [
    "{name} helped {target} with their tasks, building some goodwill.",
    "{name} assisted {target}, who seemed genuinely appreciative.",
    "{name} pitched in to help {target}, strengthening their relationship.",
  ],
  partial: [
    "{name} tried to help {target} but their assistance was only marginally useful.",
    "{name} helped {target} a bit, though they seemed distracted.",
    "{name} offered help to {target}, who accepted somewhat reluctantly.",
  ],
  failure: [
    "{name} tried to help {target} but got in the way more than anything.",
    "{name} attempted to assist {target}, but it didn't make much difference.",
    "{name} offered help to {target}, but they declined.",
  ],
  critical_failure: [
    "{name} tried to help {target} but accidentally ruined what they were working on!",
    "{name} attempted to assist {target} but they got into an argument instead.",
    "{name} offered help but {target} saw it as condescending and got offended.",
  ],
};

const BUILD_NARRATIVES: NarrativeTemplate = {
  critical_success: [
    "{name} constructed an impressive shelter that will protect them from the elements!",
    "{name} built a sturdy structure with expert craftsmanship.",
    "{name} created an amazing shelter that even impressed the other castaways.",
  ],
  success: [
    "{name} built a decent shelter that should keep the rain out.",
    "{name} constructed a functional shelter using available materials.",
    "{name} successfully improved their living conditions with some solid building work.",
  ],
  partial: [
    "{name} attempted to build shelter but it's a bit rickety and unstable.",
    "{name} constructed something resembling shelter, but it won't hold up in a storm.",
    "{name} made minimal improvements to their shelter before running out of materials.",
  ],
  failure: [
    "{name} tried to build shelter but their structure collapsed immediately.",
    "{name} spent hours building only to watch it fall apart.",
    "{name} couldn't figure out how to make the materials stay together.",
  ],
  critical_failure: [
    "{name} got injured when their shelter construction collapsed on them!",
    "{name} built a shelter that attracted a swarm of insects. They had to tear it down.",
    "{name} wasted precious resources building a completely unusable shelter.",
  ],
};

const EXPLORE_NARRATIVES: NarrativeTemplate = {
  critical_success: [
    "{name} discovered a hidden idol clue while exploring! This could change everything.",
    "{name} found an incredible vista and a secret path to a resource-rich area.",
    "{name} explored brilliantly and uncovered multiple useful discoveries.",
  ],
  success: [
    "{name} ventured into unexplored territory and found some interesting landmarks.",
    "{name} explored the island and discovered a potential fishing spot.",
    "{name} scouted new areas and gained valuable knowledge of the terrain.",
  ],
  partial: [
    "{name} explored a bit but didn't find anything particularly useful.",
    "{name} wandered around and saw some new sights, but nothing groundbreaking.",
    "{name} explored but the rough terrain made progress slow and exhausting.",
  ],
  failure: [
    "{name} got turned around while exploring and had to backtrack.",
    "{name} explored but found nothing of value and wasted energy.",
    "{name} ventured out but the dense jungle prevented any meaningful exploration.",
  ],
  critical_failure: [
    "{name} got completely lost while exploring and panicked, burning precious energy finding their way back.",
    "{name} explored carelessly and twisted their ankle on rough terrain. They're in pain.",
    "{name} disturbed a wild animal while exploring and barely escaped injury.",
  ],
};

const CRAFT_NARRATIVES: NarrativeTemplate = {
  critical_success: [
    "{name} crafted an excellent tool that will make survival much easier!",
    "{name} displayed impressive craftsmanship, creating a durable and useful item.",
    "{name} fashioned a masterwork tool from jungle materials.",
  ],
  success: [
    "{name} crafted a functional tool that should help with camp tasks.",
    "{name} successfully created a basic but useful implement.",
    "{name} managed to craft something that will make life a bit easier.",
  ],
  partial: [
    "{name} attempted to craft a tool but it's crude and might break soon.",
    "{name} made something resembling a tool, though it's not very effective.",
    "{name} crafted a barely functional item after struggling with the materials.",
  ],
  failure: [
    "{name} tried to craft a tool but couldn't get it to work properly.",
    "{name} wasted materials trying to make something useful.",
    "{name} spent hours crafting but the result was completely unusable.",
  ],
  critical_failure: [
    "{name} cut themselves badly while crafting and had to stop, bleeding.",
    "{name} broke their only good knife while trying to craft something.",
    "{name} ruined valuable materials in a failed crafting attempt.",
  ],
};

// Archetype-specific flavor text additions
const ARCHETYPE_FLAVOR: Record<CharacterArchetype, Record<string, string>> = {
  hunter: {
    forage: " Their tracking skills helped them find the best resources.",
    fish: " Their hunting instincts made the catch effortless.",
    water: " They tracked water sources like prey.",
    rest: " They rested like a predator conserving energy.",
    build: " They gathered materials with practiced efficiency.",
    explore: " Their pathfinding skills led them to hidden areas.",
    craft: " Their hands moved with the precision of a hunter.",
  },
  strategist: {
    forage: " Their methodical approach paid off.",
    fish: " They calculated the best fishing spot based on tides and patterns.",
    water: " They efficiently located the optimal water source.",
    rest: " They timed their rest strategically for maximum recovery.",
    build: " They planned the structure carefully before starting.",
    explore: " They mapped out the territory with strategic precision.",
    craft: " They thought through the design before attempting construction.",
  },
  builder: {
    forage: " They knew exactly which materials would be most useful.",
    fish: " Their crafted fishing gear gave them an edge.",
    water: " They engineered an efficient water collection system.",
    rest: " They rested in the sturdy shelter they'd built.",
    build: " Their construction expertise really showed.",
    explore: " They assessed the terrain for building potential.",
    craft: " Their engineering skills made it look easy.",
  },
  medic: {
    forage: " They carefully selected the safest and most nutritious options.",
    fish: " They handled the catch with careful, practiced hands.",
    water: " They checked the water quality with expert care.",
    rest: " They recovered with medical knowledge guiding their approach.",
    build: " They ensured the shelter met safety standards.",
    explore: " They kept an eye out for medicinal plants.",
    craft: " They crafted with caregiver's attention to detail.",
  },
  leader: {
    forage: " They inspired others to help find resources.",
    fish: " Their commanding presence seemed to attract the fish.",
    water: " They organized an efficient water-gathering expedition.",
    rest: " They rested while maintaining awareness of the tribe's needs.",
    build: " They motivated the group to work together.",
    explore: " They led a confident expedition into unknown territory.",
    craft: " They delegated tasks and coordinated the effort.",
  },
  scout: {
    forage: " Their exploration skills revealed hidden resource spots.",
    fish: " They scouted the perfect fishing location.",
    water: " Their pathfinding led them to a pristine water source.",
    rest: " They found the most secluded and peaceful resting spot.",
    build: " They used materials discovered during their explorations.",
    explore: " Their natural curiosity paid dividends.",
    craft: " They improvised with materials found while scouting.",
  },
};

/**
 * Generate a narrative outcome for a player action
 */
export function generateNarrative(
  actionType: string,
  successLevel: SuccessLevel,
  playerName: string,
  archetype: CharacterArchetype,
  targetPlayerName?: string
): string {
  let template: NarrativeTemplate;

  switch (actionType) {
    case "forage":
      template = FORAGE_NARRATIVES;
      break;
    case "fish":
      template = FISH_NARRATIVES;
      break;
    case "water":
      template = WATER_NARRATIVES;
      break;
    case "rest":
      template = REST_NARRATIVES;
      break;
    case "help":
      template = HELP_NARRATIVES;
      break;
    case "build":
      template = BUILD_NARRATIVES;
      break;
    case "explore":
      template = EXPLORE_NARRATIVES;
      break;
    case "craft":
      template = CRAFT_NARRATIVES;
      break;
    default:
      return `{name} attempted to ${actionType}.`;
  }

  const narratives = template[successLevel];
  const baseNarrative = narratives[Math.floor(Math.random() * narratives.length)];

  // Replace placeholders
  let narrative = baseNarrative
    .replace(/\{name\}/g, playerName)
    .replace(/\{target\}/g, targetPlayerName || "someone");

  // Add archetype flavor for success/critical_success
  if ((successLevel === "success" || successLevel === "critical_success") && ARCHETYPE_FLAVOR[archetype]?.[actionType]) {
    narrative += ARCHETYPE_FLAVOR[archetype][actionType];
  }

  return narrative;
}

/**
 * Determine success level from a percentage roll
 */
export function determineSuccessLevel(roll: number, threshold: number): SuccessLevel {
  const difference = roll - threshold;

  if (roll >= 95) return "critical_success";
  if (roll <= 5) return "critical_failure";
  if (difference >= 20) return "critical_success";
  if (difference >= 0) return "success";
  if (difference >= -20) return "partial";
  if (difference >= -40) return "failure";
  return "critical_failure";
}

// ========== Narrative Arc Progression ==========

export type ArcType = "redemption" | "villain" | "underdog" | "leader" | "social" | "custom";

export interface ArcMilestone {
  day: number;
  event: string;
  progress: number;
}

export interface NarrativeArcState {
  arcType: ArcType;
  progress: number; // 0-100
  milestones: ArcMilestone[];
  isActive: boolean;
}

/**
 * Calculate arc progress based on player actions and events
 */
export function calculateArcProgress(
  arcType: ArcType,
  actions: Array<{ type: string; successLevel: SuccessLevel; day: number }>,
  events: Array<{ type: string; day: number }>
): number {
  let progress = 0;

  for (const action of actions) {
    const contribution = getActionContribution(arcType, action.type, action.successLevel);
    progress += contribution;
  }

  for (const event of events) {
    const contribution = getEventContribution(arcType, event.type);
    progress += contribution;
  }

  return Math.min(100, Math.max(0, progress));
}

function getActionContribution(arcType: ArcType, actionType: string, successLevel: SuccessLevel): number {
  const baseContributions: Record<ArcType, Record<string, number>> = {
    redemption: {
      help: 2,
      rest: 1,
    },
    villain: {
      help: -1, // Helping others doesn't fit villain arc
      rest: 0.5,
    },
    underdog: {
      forage: 1.5,
      fish: 1.5,
      water: 1,
      rest: 0.5,
    },
    leader: {
      help: 3,
      build: 2,
      explore: 1,
    },
    social: {
      help: 2.5,
      rest: 1,
    },
    custom: {
      help: 1,
      rest: 0.5,
    },
  };

  const base = baseContributions[arcType]?.[actionType] || 0;
  const multiplier = successLevel === "critical_success" ? 2 : successLevel === "success" ? 1.5 : successLevel === "partial" ? 0.5 : 0;
  return base * multiplier;
}

function getEventContribution(arcType: ArcType, eventType: string): number {
  const contributions: Record<ArcType, Record<string, number>> = {
    redemption: {
      supply_drop: 5,
      reward_challenge: 3,
    },
    villain: {
      social_twist: 5,
      tribe_swap: 3,
    },
    underdog: {
      reward_challenge: 5,
      immunity_idol_clue: 3,
    },
    leader: {
      tribe_swap: 5,
      social_twist: 3,
    },
    social: {
      social_twist: 5,
      tribe_swap: 4,
    },
    custom: {},
  };

  return contributions[arcType]?.[eventType] || 0;
}

/**
 * Generate narrative text for arc milestone
 */
export function generateArcMilestoneText(arcType: ArcType, progress: number, milestone: ArcMilestone): string {
  const templates: Record<ArcType, string[]> = {
    redemption: [
      `{name} took another step toward redemption on day ${milestone.day}. ${milestone.event}`,
      `The path to redemption continues. On day ${milestone.day}, {name} ${milestone.event}`,
      `{name}'s journey of redemption reached ${progress}% completion. ${milestone.event}`,
    ],
    villain: [
      `{name}'s villainous arc deepened on day ${milestone.day}. ${milestone.event}`,
      `The villain's plan unfolds. On day ${milestone.day}, {name} ${milestone.event}`,
      `{name}'s villain arc is ${progress}% complete. ${milestone.event}`,
    ],
    underdog: [
      `{name} defied expectations on day ${milestone.day}. ${milestone.event}`,
      `The underdog story continues. On day ${milestone.day}, {name} ${milestone.event}`,
      `{name}'s underdog arc reached ${progress}% completion. ${milestone.event}`,
    ],
    leader: [
      `{name} demonstrated leadership on day ${milestone.day}. ${milestone.event}`,
      `Leadership qualities shine through. On day ${milestone.day}, {name} ${milestone.event}`,
      `{name}'s leader arc is ${progress}% complete. ${milestone.event}`,
    ],
    social: [
      `{name} strengthened social bonds on day ${milestone.day}. ${milestone.event}`,
      `Social connections deepen. On day ${milestone.day}, {name} ${milestone.event}`,
      `{name}'s social arc reached ${progress}% completion. ${milestone.event}`,
    ],
    custom: [
      `{name}'s journey progressed on day ${milestone.day}. ${milestone.event}`,
      `The story continues. On day ${milestone.day}, {name} ${milestone.event}`,
      `{name}'s arc is ${progress}% complete. ${milestone.event}`,
    ],
  };

  const templateList = templates[arcType] || templates.custom;
  return templateList[Math.floor(Math.random() * templateList.length)].replace(/{name}/g, "{name}");
}
