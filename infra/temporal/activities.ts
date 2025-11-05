import { db } from '../../drizzle/db';
import { seasons, players, events, stats, challenges, votes, tribeMembers } from '../../drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateServerSeed, generateRoll } from '../../packages/game-logic/src/rng';
import { tallyVotes } from '../../packages/game-logic/src/voting';

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

  // For now, simplified: pick a random tribe as winner
  // In a real implementation, you'd use the commit-reveal protocol

  const seasonTribes = await db.query.tribes.findMany({
    where: eq(players.seasonId, seasonId),
    with: {
      members: {
        with: {
          player: true
        }
      }
    }
  });

  if (seasonTribes.length === 0) {
    return { winningTribeId: null };
  }

  // Simple random winner for now
  const winnerIndex = Math.floor(Math.random() * seasonTribes.length);
  const winningTribeId = seasonTribes[winnerIndex]?.id ?? null;

  // Emit challenge result event
  await db.insert(events).values({
    seasonId,
    day,
    kind: 'phase_close',
    payloadJson: {
      phase: 'challenge',
      winningTribeId
    },
  });

  return { winningTribeId };
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
