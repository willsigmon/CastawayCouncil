import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const {
  emitPhaseEvent,
  scoreChallengeActivity,
  tallyVotesActivity,
  checkMergeActivity,
  emitDailySummaryActivity,
  createDayStatsActivity,
  applyStatDecayActivity,
  checkMedicalEvacsActivity,
  runFinaleActivity,
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
 * Days 1-14: One elimination per day
 * Day 15: Finale (Final 4 → winner picks 2 for battle → Final 3 → Jury vote)
 */
export async function seasonWorkflow(input: SeasonWorkflowInput): Promise<void> {
  const { seasonId, totalDays = 15, fastForwardMode = false } = input;

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

    // Check if we're at finale (day 15 or when 4 players remain)
    const mergeCheck = await checkMergeActivity({ seasonId, day });
    if (day === 15 || mergeCheck.remainingPlayers === 4) {
      console.log(`Day ${day}: FINALE begins with ${mergeCheck.remainingPlayers} players`);
      await runFinaleActivity({ seasonId, day });
      break;
    }

    // Create stats for new day and apply decay
    await createDayStatsActivity({ seasonId, day });
    await applyStatDecayActivity({ seasonId, day });

    // Check for medical evacuations (players with total stats ≤ 50)
    const medicalEvacs = await checkMedicalEvacsActivity({ seasonId, day });
    if (medicalEvacs.evacuatedCount > 0) {
      console.log(`Day ${day}: ${medicalEvacs.evacuatedCount} medical evacuation(s)`);
    }

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

    // Lock challenge
    await emitPhaseEvent({
      seasonId,
      day,
      phase: 'challenge',
      action: 'close'
    });

    // Score the challenge
    const challengeResult = await scoreChallengeActivity({ seasonId, day });

    if (challengeResult.winningTribeId || challengeResult.winningPlayerId) {
      const winner = challengeResult.winningTribeId || challengeResult.winningPlayerId;
      console.log(`Day ${day}: ${winner} won immunity`);
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
      immuneTribeId: challengeResult.winningTribeId,
      immunePlayerId: challengeResult.winningPlayerId,
    });

    if (eliminationResult.eliminatedPlayerId) {
      console.log(`Day ${day}: Player ${eliminationResult.eliminatedPlayerId} was eliminated`);
    }

    // Check for merge condition (at 12 players)
    const mergeResult = await checkMergeActivity({ seasonId, day });

    if (mergeResult.merged && !mergeResult.alreadyMerged) {
      console.log(`Day ${day}: MERGE! ${mergeResult.remainingPlayers} players remain`);
      console.log(`Tribes disbanded. Individual immunity begins.`);
    }

    // Emit daily summary
    await emitDailySummaryActivity({ seasonId, day });

    // Check if we should proceed to finale early
    if (mergeResult.remainingPlayers <= 4) {
      console.log(`Season ${seasonId}: Final 4 reached early. Proceeding to finale.`);
      break;
    }
  }

  console.log(`Season ${seasonId}: Workflow completed`);
}
