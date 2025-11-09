import { proxyActivities, log, sleep, condition } from "@temporalio/workflow";
import type * as activities from "./activities";

const {
  emitPush,
  scoreChallenge,
  tallyVotes,
  mergeTribes,
  emitDailySummary,
  checkScheduledEvents,
  advanceProjects,
  tickResources,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export type GameMode = "classic" | "speed" | "hardcore" | "casual";

export interface SeasonWorkflowInput {
  seasonId: string;
  gameMode?: GameMode;
  totalDays?: number; // Legacy support
  fastForwardEnabled?: boolean; // Legacy support
}

// Game mode configurations imported from @game-logic/rules
const GAME_MODE_CONFIGS = {
  classic: {
    totalDays: 12,
    mergeDay: 10,
    durations: {
      camp: 8 * 60 * 60 * 1000,
      challenge: 8 * 60 * 60 * 1000,
      vote: 6 * 60 * 60 * 1000,
    },
  },
  speed: {
    totalDays: 6,
    mergeDay: 4,
    durations: {
      camp: 2 * 60 * 60 * 1000,
      challenge: 2 * 60 * 60 * 1000,
      vote: 1 * 60 * 60 * 1000,
    },
  },
  hardcore: {
    totalDays: 15,
    mergeDay: 12,
    durations: {
      camp: 12 * 60 * 60 * 1000,
      challenge: 10 * 60 * 60 * 1000,
      vote: 8 * 60 * 60 * 1000,
    },
  },
  casual: {
    totalDays: 10,
    mergeDay: 8,
    durations: {
      camp: 6 * 60 * 60 * 1000,
      challenge: 6 * 60 * 60 * 1000,
      vote: 4 * 60 * 60 * 1000,
    },
  },
};

// Legacy fast-forward mode for testing
const FAST_FORWARD_DURATIONS = {
  camp: 5 * 60 * 1000,
  challenge: 5 * 60 * 1000,
  vote: 3 * 60 * 1000,
};

export async function seasonWorkflow(input: SeasonWorkflowInput): Promise<void> {
  const {
    seasonId,
    gameMode = "classic",
    totalDays: legacyTotalDays,
    fastForwardEnabled = false,
  } = input;

  // Determine configuration based on game mode or legacy settings
  const config = fastForwardEnabled
    ? {
        totalDays: legacyTotalDays || 12,
        mergeDay: 10,
        durations: FAST_FORWARD_DURATIONS,
      }
    : GAME_MODE_CONFIGS[gameMode];

  const { totalDays, mergeDay, durations } = config;

  log.info(`Starting season ${seasonId} workflow`);

  for (let day = 1; day <= totalDays; day++) {
    log.info(`Starting day ${day}`);

    // Camp phase
    await openPhase(seasonId, day, "camp", durations.camp);
    await checkScheduledEvents({ seasonId, day, phase: "camp" });
    await tickResources({ seasonId, day });
    await advanceProjects({ seasonId, day });
    await sleep(durations.camp);

    // Challenge phase
    await openPhase(seasonId, day, "challenge", durations.challenge);
    await checkScheduledEvents({ seasonId, day, phase: "challenge" });
    await sleep(durations.challenge);
    await scoreChallenge({ seasonId, day });

    // Vote phase
    await openPhase(seasonId, day, "vote", durations.vote);
    await checkScheduledEvents({ seasonId, day, phase: "vote" });
    await sleep(durations.vote);
    await tallyVotes({ seasonId, day });

    // Check for merge at configured merge day
    if (day === mergeDay) {
      await mergeTribes({ seasonId });
      log.info(`Merged tribes on day ${day} (${gameMode} mode)`);
    }

    await emitDailySummary({ seasonId, day });
  }

  log.info(`Season ${seasonId} completed`);
}

async function openPhase(
  seasonId: string,
  day: number,
  phase: "camp" | "challenge" | "vote",
  duration: number
): Promise<void> {
  const now = new Date();
  const closesAt = new Date(now.getTime() + duration);

  // Emit phase_open event via activity (workflows can't directly access DB)
  // The emitPush activity will handle DB event creation
  await emitPush({
    seasonId,
    type: "phase_open",
    phase,
    day,
    closesAt: closesAt.toISOString(),
  });
}
