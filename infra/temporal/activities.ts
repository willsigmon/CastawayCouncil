import { db } from '../../drizzle/db';
import { seasons, players, events, stats, challenges, challengeResults, votes, tribeMembers, tribes, weatherEvents, randomEvents, rumors, secretMissions } from '../../drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateServerSeed, generateRoll } from '../../packages/game-logic/src/rng';
import { tallyVotes } from '../../packages/game-logic/src/voting';
import { calculateScore } from '../../packages/game-logic/src/scoring';
import { generateDailyWeather } from '../../packages/game-logic/src/weather';
import { shouldTriggerRandomEvent, generateRandomEvent } from '../../packages/game-logic/src/random-events';
import { generateRumor, generateContextualRumor } from '../../packages/game-logic/src/rumors';
import { generateSecretMission } from '../../packages/game-logic/src/secret-missions';

export interface PhaseEventInput {
  seasonId: string;
  day: number;
  phase: 'camp' | 'challenge' | 'vote';
  action: 'open' | 'close';
}

export interface CreateDayStatsInput {
  seasonId: string;
  day: number;
}

export interface ScoreChallengeInput {
  seasonId: string;
  day: number;
}

export interface ScoreChallengeResult {
  winningTribeId: string | null;
  winningPlayerId: string | null;
}

export interface TallyVotesInput {
  seasonId: string;
  day: number;
  immuneTribeId?: string | null;
}

export interface TallyVotesResult {
  eliminatedPlayerId: string | null;
}

export interface CheckMergeInput {
  seasonId: string;
  day: number;
}

export interface CheckMergeResult {
  merged: boolean;
  remainingPlayers: number;
}

export interface DailySummaryInput {
  seasonId: string;
  day: number;
}

/**
 * Emit a phase event to the database
 */
export async function emitPhaseEvent(input: PhaseEventInput): Promise<void> {
  const { seasonId, day, phase, action } = input;

  await db.insert(events).values({
    seasonId,
    day,
    kind: 'phase_open', // or phase_close based on action
    payloadJson: { phase, action },
  });

  console.log(`Phase event: ${phase} ${action} on day ${day}`);
}

/**
 * Create stats entries for all active players for a new day
 */
export async function createDayStatsActivity(input: CreateDayStatsInput): Promise<void> {
  const { seasonId, day } = input;

  // Get all active (non-eliminated) players
  const activePlayers = await db.query.players.findMany({
    where: and(
      eq(players.seasonId, seasonId),
      isNull(players.eliminatedAt)
    ),
  });

  // If it's day 1, initialize with full stats
  if (day === 1) {
    const initialStats = activePlayers.map(player => ({
      playerId: player.id,
      day,
      energy: 100,
      hunger: 100,
      thirst: 100,
      social: 50,
    }));

    await db.insert(stats).values(initialStats);
    return;
  }

  // For subsequent days, copy from previous day with slight decay
  const previousDayStats = await db.query.stats.findMany({
    where: eq(stats.day, day - 1),
  });

  const newDayStats = activePlayers.map(player => {
    const prevStats = previousDayStats.find(s => s.playerId === player.id);
    return {
      playerId: player.id,
      day,
      energy: Math.max(50, (prevStats?.energy ?? 100) - 10),
      hunger: Math.max(30, (prevStats?.hunger ?? 100) - 15),
      thirst: Math.max(30, (prevStats?.thirst ?? 100) - 20),
      social: prevStats?.social ?? 50,
    };
  });

  await db.insert(stats).values(newDayStats);
}

/**
 * Score the challenge for the day
 */
export async function scoreChallengeActivity(input: ScoreChallengeInput): Promise<ScoreChallengeResult> {
  const { seasonId, day } = input;

  // Get the challenge for this day
  const challenge = await db.query.challenges.findFirst({
    where: and(eq(challenges.seasonId, seasonId), eq(challenges.day, day)),
    with: {
      submissions: true,
    },
  });

  if (!challenge) {
    console.log(`No challenge found for day ${day}`);
    return { winningTribeId: null, winningPlayerId: null };
  }

  // Check if merge has occurred
  const mergeCheck = await db.query.seasons.findFirst({
    where: eq(seasons.id, seasonId),
  });
  const isMerged = (mergeCheck?.mergedAt !== null);

  if (isMerged) {
    // Individual immunity - score individual players
    const playerScores: Array<{ playerId: string; score: number }> = [];

    for (const submission of challenge.submissions) {
      if (submission.subjectType !== 'player') continue;

      // Get player stats
      const playerStats = await db.query.stats.findFirst({
        where: and(eq(stats.playerId, submission.subjectId), eq(stats.day, day)),
      });

      if (!playerStats) continue;

      // Calculate score with performance fatigue
      const roll = (submission.submissionData as any).roll || Math.floor(Math.random() * 20) + 1;
      const scoreResult = calculateScore(
        roll,
        {
          energy: playerStats.energy,
          hunger: playerStats.hunger,
          thirst: playerStats.thirst,
          comfort: playerStats.comfort,
          social: playerStats.social,
        },
        {
          energy: 0,
          hunger: 0,
          thirst: 0,
          itemBonus: (submission.submissionData as any).itemBonus || 0,
          eventBonus: 0,
          debuffs: [],
        }
      );

      playerScores.push({ playerId: submission.subjectId, score: scoreResult.total });

      // Save result
      await db.insert(challengeResults).values({
        challengeId: challenge.id,
        subjectType: 'player',
        subjectId: submission.subjectId,
        score: scoreResult.total,
        metadata: { breakdown: scoreResult.breakdown },
      });
    }

    // Find winner
    const winner = playerScores.sort((a, b) => b.score - a.score)[0];

    // Emit challenge result event
    await db.insert(events).values({
      seasonId,
      day,
      kind: 'phase_close',
      payloadJson: {
        phase: 'challenge',
        winningPlayerId: winner?.playerId,
      },
    });

    return { winningTribeId: null, winningPlayerId: winner?.playerId || null };
  } else {
    // Tribe immunity - score tribes
    const seasonTribes = await db.query.tribes.findMany({
      where: eq(tribes.seasonId, seasonId),
      with: {
        members: {
          with: {
            player: true,
          },
        },
      },
    });

    const tribeScores: Array<{ tribeId: string; score: number }> = [];

    for (const tribe of seasonTribes) {
      let tribeTotal = 0;
      let participantCount = 0;

      for (const member of tribe.members) {
        // Get player stats
        const playerStats = await db.query.stats.findFirst({
          where: and(eq(stats.playerId, member.playerId), eq(stats.day, day)),
        });

        if (!playerStats) continue;

        // Calculate score with performance fatigue
        const roll = Math.floor(Math.random() * 20) + 1;
        const scoreResult = calculateScore(
          roll,
          {
            energy: playerStats.energy,
            hunger: playerStats.hunger,
            thirst: playerStats.thirst,
            comfort: playerStats.comfort,
            social: playerStats.social,
          },
          {
            energy: 0,
            hunger: 0,
            thirst: 0,
            itemBonus: 0,
            eventBonus: 0,
            debuffs: [],
          }
        );

        tribeTotal += scoreResult.total;
        participantCount++;
      }

      if (participantCount > 0) {
        tribeScores.push({ tribeId: tribe.id, score: tribeTotal });

        // Save tribe result
        await db.insert(challengeResults).values({
          challengeId: challenge.id,
          subjectType: 'tribe',
          subjectId: tribe.id,
          score: tribeTotal,
          metadata: { participants: participantCount },
        });
      }
    }

    // Find winner
    const winner = tribeScores.sort((a, b) => b.score - a.score)[0];

    // Emit challenge result event
    await db.insert(events).values({
      seasonId,
      day,
      kind: 'phase_close',
      payloadJson: {
        phase: 'challenge',
        winningTribeId: winner?.tribeId,
      },
    });

    return { winningTribeId: winner?.tribeId || null, winningPlayerId: null };
  }
}

/**
 * Tally votes and eliminate a player
 */
export async function tallyVotesActivity(input: TallyVotesInput): Promise<TallyVotesResult> {
  const { seasonId, day, immuneTribeId } = input;

  // Get all votes for this day
  const dayVotes = await db.query.votes.findMany({
    where: and(
      eq(votes.seasonId, seasonId),
      eq(votes.day, day)
    ),
  });

  if (dayVotes.length === 0) {
    console.log(`No votes cast on day ${day}`);
    return { eliminatedPlayerId: null };
  }

  // Get immune players (those in winning tribe)
  let immunePlayerIds: string[] = [];
  if (immuneTribeId) {
    const immuneMembers = await db.query.tribeMembers.findMany({
      where: eq(tribeMembers.tribeId, immuneTribeId),
    });
    immunePlayerIds = immuneMembers.map(m => m.playerId);
  }

  // Tally votes
  const voteData = dayVotes.map(v => ({
    voterId: v.voterPlayerId,
    targetId: v.targetPlayerId,
    idolPlayed: v.idolPlayed,
  }));

  const result = tallyVotes(voteData, immunePlayerIds);

  if (result.eliminatedId) {
    // Mark player as eliminated
    await db
      .update(players)
      .set({
        eliminatedAt: new Date(),
        role: 'jury', // They become jury after merge
      })
      .where(eq(players.id, result.eliminatedId));

    // Emit elimination event
    await db.insert(events).values({
      seasonId,
      day,
      kind: 'eliminate',
      payloadJson: {
        eliminatedPlayerId: result.eliminatedId,
        tallies: result.tallies,
      },
    });

    // Reveal votes
    await db
      .update(votes)
      .set({ revealedAt: new Date() })
      .where(and(
        eq(votes.seasonId, seasonId),
        eq(votes.day, day)
      ));
  }

  return { eliminatedPlayerId: result.eliminatedId };
}

/**
 * Check if merge should occur
 */
export async function checkMergeActivity(input: CheckMergeInput): Promise<CheckMergeResult> {
  const { seasonId, day } = input;

  // Count remaining players
  const activePlayers = await db.query.players.findMany({
    where: and(
      eq(players.seasonId, seasonId),
      isNull(players.eliminatedAt)
    ),
  });

  const remainingCount = activePlayers.length;
  const shouldMerge = remainingCount <= 10;

  if (shouldMerge) {
    // Emit merge event
    await db.insert(events).values({
      seasonId,
      day,
      kind: 'merge',
      payloadJson: {
        remainingPlayers: remainingCount,
      },
    });
  }

  return {
    merged: shouldMerge,
    remainingPlayers: remainingCount,
  };
}

/**
 * Emit daily summary
 */
export async function emitDailySummaryActivity(input: DailySummaryInput): Promise<void> {
  const { seasonId, day } = input;

  // Get day's events
  const dayEvents = await db.query.events.findMany({
    where: and(
      eq(events.seasonId, seasonId),
      eq(events.day, day)
    ),
  });

  console.log(`Day ${day} summary: ${dayEvents.length} events`);

  // Update season day index
  await db
    .update(seasons)
    .set({ dayIndex: day })
    .where(eq(seasons.id, seasonId));
}

/**
 * Apply daily stat decay with class modifiers
 */
export async function applyStatDecayActivity(input: CreateDayStatsInput): Promise<void> {
  const { seasonId, day } = input;

  // Get all active players with their classes
  const activePlayers = await db.query.players.findMany({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
  });

  // Get yesterday's stats
  const previousDayStats = await db.query.stats.findMany({
    where: eq(stats.day, day - 1),
  });

  for (const player of activePlayers) {
    const prevStats = previousDayStats.find((s) => s.playerId === player.id);
    if (!prevStats) continue;

    // Calculate decay multiplier based on class
    let decayMultiplier = 1.0;
    if (player.playerClass === 'survivalist') {
      decayMultiplier = 0.85; // 15% slower decay
    } else if (player.playerClass === 'wildcard' && player.wildcardAbility === 'survivalist') {
      decayMultiplier = 0.85;
    }

    // Apply decay
    const newHunger = Math.max(0, prevStats.hunger - 15 * decayMultiplier);
    const newThirst = Math.max(0, prevStats.thirst - 20 * decayMultiplier);
    const newComfort = Math.max(0, prevStats.comfort - 10 * decayMultiplier);
    const newEnergy = Math.floor((newHunger + newThirst + newComfort) / 3);

    // Update stats
    await db
      .update(stats)
      .set({
        hunger: newHunger,
        thirst: newThirst,
        comfort: newComfort,
        energy: newEnergy,
      })
      .where(and(eq(stats.playerId, player.id), eq(stats.day, day)));
  }

  console.log(`Applied stat decay for ${activePlayers.length} players on day ${day}`);
}

/**
 * Check for medical evacuations (total stats ≤ 50)
 */
export interface CheckMedicalEvacsResult {
  evacuatedCount: number;
  evacuatedPlayerIds: string[];
}

export async function checkMedicalEvacsActivity(
  input: CreateDayStatsInput
): Promise<CheckMedicalEvacsResult> {
  const { seasonId, day } = input;

  const activePlayers = await db.query.players.findMany({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
    with: {
      stats: {
        where: eq(stats.day, day),
      },
    },
  });

  const evacuatedPlayerIds: string[] = [];

  for (const player of activePlayers) {
    const currentStats = player.stats[0];
    if (!currentStats) continue;

    const total = currentStats.hunger + currentStats.thirst + currentStats.comfort;

    if (total <= 50) {
      // Mark as medical alert
      await db
        .update(stats)
        .set({ medicalAlert: true })
        .where(and(eq(stats.playerId, player.id), eq(stats.day, day)));

      // TODO: Give player 15 minutes to improve stats
      // For now, immediately evacuate

      await db
        .update(players)
        .set({ eliminatedAt: new Date(), role: 'spectator' })
        .where(eq(players.id, player.id));

      evacuatedPlayerIds.push(player.id);

      // Emit medical evac event
      await db.insert(events).values({
        seasonId,
        day,
        kind: 'medical_evac',
        payloadJson: {
          playerId: player.id,
          displayName: player.displayName,
          totalStats: total,
        },
      });

      console.log(
        `Medical evacuation: ${player.displayName} (total stats: ${total})`
      );
    }
  }

  return {
    evacuatedCount: evacuatedPlayerIds.length,
    evacuatedPlayerIds,
  };
}

/**
 * Run the finale (Final 4 → winner picks 2 for battle → Final 3 → Jury vote)
 */
export interface RunFinaleInput {
  seasonId: string;
  day: number;
}

export async function runFinaleActivity(input: RunFinaleInput): Promise<void> {
  const { seasonId, day } = input;

  console.log(`Running finale for season ${seasonId} on day ${day}`);

  // Get final 4 players
  const finalPlayers = await db.query.players.findMany({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
  });

  if (finalPlayers.length !== 4) {
    console.error(`Expected 4 players for finale, got ${finalPlayers.length}`);
    // Continue anyway
  }

  // Emit finale event
  await db.insert(events).values({
    seasonId,
    day,
    kind: 'finale',
    payloadJson: {
      phase: 'final_4',
      playerIds: finalPlayers.map((p) => p.id),
    },
  });

  // TODO: In a real implementation:
  // 1. Run final immunity challenge
  // 2. Winner picks 2 players for fire-making challenge
  // 3. Winner of fire-making joins Final 3
  // 4. Jury votes
  // 5. Announce winner

  // For now, mark all as finalists
  for (const player of finalPlayers) {
    await db
      .update(players)
      .set({ role: 'finalist' })
      .where(eq(players.id, player.id));
  }

  // Mark season as complete
  await db.update(seasons).set({ status: 'complete' }).where(eq(seasons.id, seasonId));

  console.log(`Finale completed. Season ${seasonId} is now complete.`);
}

/**
 * Generate daily weather
 */
export interface GenerateWeatherInput {
  seasonId: string;
  day: number;
}

export async function generateDailyWeatherActivity(input: GenerateWeatherInput): Promise<void> {
  const { seasonId, day } = input;

  console.log(`Generating weather for season ${seasonId} day ${day}`);

  // Generate weather
  const weather = generateDailyWeather(day);

  // Save to database
  await db.insert(weatherEvents).values({
    seasonId,
    day,
    weatherType: weather.weatherType,
    severity: weather.severity,
    hungerModifier: weather.hungerModifier,
    thirstModifier: weather.thirstModifier,
    comfortModifier: weather.comfortModifier,
    description: weather.description,
  });

  // Emit weather change event
  await db.insert(events).values({
    seasonId,
    day,
    kind: 'weather_change',
    payloadJson: {
      weatherType: weather.weatherType,
      severity: weather.severity,
      description: weather.description,
    },
  });

  console.log(`Weather generated: ${weather.weatherType} (severity ${weather.severity})`);
}

/**
 * Trigger random events
 */
export interface TriggerRandomEventsInput {
  seasonId: string;
  day: number;
}

export async function triggerRandomEventsActivity(input: TriggerRandomEventsInput): Promise<void> {
  const { seasonId, day } = input;

  // Check if we should trigger a random event
  if (!shouldTriggerRandomEvent(day)) {
    console.log(`No random event triggered for day ${day}`);
    return;
  }

  // Get context
  const activePlayers = await db.query.players.findMany({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
  });

  const allTribes = await db.query.tribes.findMany({
    where: eq(tribeMembers.tribeId, seasonId),
  });

  const context = {
    players: activePlayers.map((p) => ({ id: p.id, name: p.displayName })),
    recentEvents: [],
    tribeIds: allTribes.map((t) => t.id),
  };

  // Generate random event
  const event = generateRandomEvent(day);

  // Determine target
  let targetId: string;
  if (event.targetType === 'player') {
    const randomPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    targetId = randomPlayer!.id;
  } else {
    const randomTribe = allTribes[Math.floor(Math.random() * allTribes.length)];
    targetId = randomTribe!.id;
  }

  // Save to database
  await db.insert(randomEvents).values({
    seasonId,
    day,
    eventType: event.eventType,
    targetType: event.targetType,
    targetId,
    description: event.description,
    effects: event.effects,
  });

  // Emit event
  await db.insert(events).values({
    seasonId,
    day,
    kind: 'random_event',
    payloadJson: {
      eventType: event.eventType,
      targetType: event.targetType,
      targetId,
      description: event.description,
    },
  });

  console.log(`Random event: ${event.eventType} affecting ${event.targetType} ${targetId}`);
}

/**
 * Generate daily rumors
 */
export interface GenerateRumorsInput {
  seasonId: string;
  day: number;
}

export async function generateDailyRumorsActivity(input: GenerateRumorsInput): Promise<void> {
  const { seasonId, day } = input;

  console.log(`Generating rumors for season ${seasonId} day ${day}`);

  // Get context
  const activePlayers = await db.query.players.findMany({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
  });

  const allTribes = await db.query.tribes.findMany({
    where: eq(tribes.seasonId, seasonId),
  });

  const context = {
    players: activePlayers.map((p) => ({ id: p.id, name: p.displayName })),
    recentEvents: [],
    tribeIds: allTribes.map((t) => t.id),
  };

  // Generate 1-3 rumors per day
  const rumorCount = 1 + Math.floor(Math.random() * 3);

  for (let i = 0; i < rumorCount; i++) {
    const rumor = generateRumor(day, context);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + rumor.expiresInDays);

    // Save to database
    await db.insert(rumors).values({
      seasonId,
      day,
      content: rumor.content,
      truthful: rumor.truthful,
      targetPlayerId: rumor.targetPlayerId || null,
      visibleTo: rumor.visibleTo,
      expiresAt,
    });

    // Emit rumor event
    await db.insert(events).values({
      seasonId,
      day,
      kind: 'rumor_started',
      payloadJson: {
        content: rumor.content,
        truthful: rumor.truthful,
        impact: rumor.impact,
      },
    });
  }

  console.log(`Generated ${rumorCount} rumors for day ${day}`);
}

/**
 * Assign secret missions to random players
 */
export interface AssignMissionsInput {
  seasonId: string;
  day: number;
}

export async function assignDailyMissionsActivity(input: AssignMissionsInput): Promise<void> {
  const { seasonId, day } = input;

  console.log(`Assigning missions for season ${seasonId} day ${day}`);

  // Get active players
  const activePlayers = await db.query.players.findMany({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
    with: {
      tribeMembers: {
        with: {
          tribe: true,
        },
      },
    },
  });

  // Assign mission to 30-50% of players
  const missionChance = 0.3 + Math.random() * 0.2;

  for (const player of activePlayers) {
    if (Math.random() > missionChance) continue;

    // Get context for mission generation
    const tribeMates =
      player.tribeMembers[0]?.tribe
        ? activePlayers
            .filter(
              (p) =>
                p.tribeMembers[0]?.tribe?.id === player.tribeMembers[0]?.tribe?.id &&
                p.id !== player.id
            )
            .map((p) => p.id)
        : [];

    const rivals = activePlayers
      .filter((p) => p.id !== player.id && !tribeMates.includes(p.id))
      .map((p) => p.id);

    const context = {
      tribemates: tribeMates,
      rivals,
      currentAlliances: [], // TODO: Get from relationships table
    };

    // Generate mission
    const mission = generateSecretMission(player.id, day, context);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + mission.expiresInDays);

    // Save to database
    await db.insert(secretMissions).values({
      playerId: player.id,
      seasonId,
      day,
      title: mission.title,
      description: mission.description,
      objective: mission.objective,
      reward: mission.reward,
      status: 'assigned',
      expiresAt,
    });

    // Emit mission assigned event
    await db.insert(events).values({
      seasonId,
      day,
      kind: 'secret_mission_assigned',
      payloadJson: {
        playerId: player.id,
        missionType: mission.objective.type,
      },
    });
  }

  console.log(`Assigned missions to players for day ${day}`);
}
