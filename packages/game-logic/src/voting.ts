/**
 * Voting and elimination logic
 */

export interface Vote {
  voterId: string;
  targetId: string;
  idolPlayed: boolean;
}

export interface VoteTally {
  targetId: string;
  votes: number;
  voterIds: string[];
}

export interface EliminationResult {
  eliminatedId: string | null;
  tallies: VoteTally[];
  tie: boolean;
  revoteRequired: boolean;
  fireMakingRequired: boolean;
}

/**
 * Count votes and determine elimination
 */
export function tallyVotes(votes: Vote[], immunePlayerIds: string[] = []): EliminationResult {
  // Filter out votes negated by idol play
  const validVotes = votes.filter((v) => !v.idolPlayed);

  // Count votes per target
  const tallies = new Map<string, VoteTally>();

  for (const vote of validVotes) {
    if (!tallies.has(vote.targetId)) {
      tallies.set(vote.targetId, {
        targetId: vote.targetId,
        votes: 0,
        voterIds: [],
      });
    }
    const tally = tallies.get(vote.targetId)!;
    tally.votes += 1;
    tally.voterIds.push(vote.voterId);
  }

  // Remove immune players from consideration
  for (const immuneId of immunePlayerIds) {
    tallies.delete(immuneId);
  }

  const talliesArray = Array.from(tallies.values()).sort((a, b) => b.votes - a.votes);

  if (talliesArray.length === 0) {
    return {
      eliminatedId: null,
      tallies: [],
      tie: false,
      revoteRequired: false,
      fireMakingRequired: false,
    };
  }

  const maxVotes = talliesArray[0]!.votes;
  const tied = talliesArray.filter((t) => t.votes === maxVotes);

  // Clear winner
  if (tied.length === 1) {
    return {
      eliminatedId: tied[0]!.targetId,
      tallies: talliesArray,
      tie: false,
      revoteRequired: false,
      fireMakingRequired: false,
    };
  }

  // Tie - requires revote or fire-making
  // Simplified: always require fire-making for ties at final stages
  return {
    eliminatedId: null,
    tallies: talliesArray,
    tie: true,
    revoteRequired: true,
    fireMakingRequired: false, // Can be set based on game rules
  };
}

/**
 * Fire-making challenge result (simplified coin flip)
 */
export function resolveFireMaking(player1Id: string, player2Id: string, rngValue: number): string {
  // Use RNG value (0-1 range assumed) to pick winner
  return rngValue < 0.5 ? player1Id : player2Id;
}

/**
 * Check if merge should occur
 */
export function shouldMerge(remainingPlayers: number, mergeThreshold: number = 10): boolean {
  return remainingPlayers <= mergeThreshold;
}

/**
 * Determine jury eligibility
 * Players eliminated after merge join the jury
 */
export function isJuryEligible(eliminatedDay: number, mergeDay: number): boolean {
  return eliminatedDay >= mergeDay;
}
