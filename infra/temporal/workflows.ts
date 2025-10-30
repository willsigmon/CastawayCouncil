import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const {
  emitPhaseEvent,
  scoreChallengeActivity,
  tallyVotesActivity,
  checkMergeActivity,
  emitDailySummaryActivity,
  createDayStatsActivity
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '1s',
    maximumInterval: '30s',
    maximumAttempts: 3,
  },
});

export interface SeasonWorkflowInput {
  seasonId: string;
  totalDays: number;
  fastForwardMode?: boolean;
}

/**
 * Main season workflow that orchestrates the entire game
 * Loops through days, managing phases, challenges, and votes
 */
export async function seasonWorkflow(input: SeasonWorkflowInput): Promise<void> {
  const { seasonId, totalDays, fastForwardMode = false } = input;

  // Phase durations (in milliseconds)
  // Fast-forward: 1 minute = 1 hour, so 8 hours = 8 minutes
  const phaseDurations = fastForwardMode
    ? {
        camp: 8 * 60 * 1000,       // 8 minutes
        challenge: 8 * 60 * 1000,  // 8 minutes
        vote: 6 * 60 * 1000,       // 6 minutes
      }
    : {
        camp: 8 * 60 * 60 * 1000,     // 8 hours
        challenge: 8 * 60 * 60 * 1000, // 8 hours
        vote: 6 * 60 * 60 * 1000,      // 6 hours
      };

  for (let day = 1; day <= totalDays; day++) {
    console.log(`Season ${seasonId}: Starting Day ${day}`);

    // Create stats for new day
    await createDayStatsActivity({ seasonId, day });

    // Phase 1: Camp (gather resources, socialize)
    await emitPhaseEvent({
      seasonId,
      day,
      phase: 'camp',
      action: 'open'
    });

    await sleep(phaseDurations.camp);

    await emitPhaseEvent({
      seasonId,
      day,
      phase: 'camp',
      action: 'close'
    });

    // Phase 2: Challenge
    await emitPhaseEvent({
      seasonId,
      day,
      phase: 'challenge',
      action: 'open'
    });

    await sleep(phaseDurations.challenge);

    // Lock challenge commits
    await emitPhaseEvent({
      seasonId,
      day,
      phase: 'challenge',
      action: 'close'
    });

    // Score the challenge
    const challengeResult = await scoreChallengeActivity({ seasonId, day });

    if (challengeResult.winningTribeId) {
      console.log(`Day ${day}: Tribe ${challengeResult.winningTribeId} won immunity`);
    }

    // Phase 3: Tribal Council / Vote
    await emitPhaseEvent({
      seasonId,
      day,
      phase: 'vote',
      action: 'open'
    });

    await sleep(phaseDurations.vote);

    await emitPhaseEvent({
      seasonId,
      day,
      phase: 'vote',
      action: 'close'
    });

    // Tally votes and eliminate
    const eliminationResult = await tallyVotesActivity({
      seasonId,
      day,
      immuneTribeId: challengeResult.winningTribeId
    });

    if (eliminationResult.eliminatedPlayerId) {
      console.log(`Day ${day}: Player ${eliminationResult.eliminatedPlayerId} was eliminated`);
    }

    // Check for merge condition
    const mergeResult = await checkMergeActivity({ seasonId, day });

    if (mergeResult.merged) {
      console.log(`Day ${day}: MERGE! ${mergeResult.remainingPlayers} players remain`);
    }

    // Emit daily summary
    await emitDailySummaryActivity({ seasonId, day });

    // Check if season should end (final 3 or fewer)
    if (mergeResult.remainingPlayers <= 3) {
      console.log(`Season ${seasonId}: Final ${mergeResult.remainingPlayers} reached. Proceeding to finale.`);
      break;
    }
  }

  console.log(`Season ${seasonId}: Workflow completed`);
}
