/**
 * Tower of Ten Challenge
 *
 * Team puzzle challenge with two phases:
 * 1. Building: Each tribe secretly picks 1-5 feet to add (matching = zero gain)
 * 2. Puzzle: Once 15ft reached, solve emoji puzzle with feedback
 *
 * Winner: Tribe that completes puzzle in fewest turns
 * Loser: Most turns = Tribal Council
 */

export interface TowerOfTenState {
  phase: 'building' | 'puzzle' | 'complete';
  tribeHeights: Record<string, number>; // tribeId -> current height
  tribeSubmissions: Record<string, number[]>; // tribeId -> array of submitted heights per round
  puzzleSolution: string[]; // The correct emoji sequence
  puzzleGuesses: Record<string, Array<{ guess: string[]; feedback: string }>>; // tribeId -> guesses with feedback
  turns: Record<string, number>; // tribeId -> total turns taken
}

const EMOJI_OPTIONS = ['🔥', '💧', '⚡️', '🕳️', '⌛️', '🌲', '🧨', '🏝️'];
const TOWER_HEIGHT_GOAL = 15;
const PUZZLE_LENGTH = 5;

/**
 * Initialize a new Tower of Ten challenge
 */
export function initializeTowerOfTen(tribeIds: string[]): TowerOfTenState {
  // Generate random emoji sequence
  const solution: string[] = [];
  for (let i = 0; i < PUZZLE_LENGTH; i++) {
    const randomEmoji = EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)]!;
    solution.push(randomEmoji);
  }

  const tribeHeights: Record<string, number> = {};
  const tribeSubmissions: Record<string, number[]> = {};
  const puzzleGuesses: Record<string, Array<{ guess: string[]; feedback: string }>> = {};
  const turns: Record<string, number> = {};

  for (const tribeId of tribeIds) {
    tribeHeights[tribeId] = 0;
    tribeSubmissions[tribeId] = [];
    puzzleGuesses[tribeId] = [];
    turns[tribeId] = 0;
  }

  return {
    phase: 'building',
    tribeHeights,
    tribeSubmissions,
    puzzleSolution: solution,
    puzzleGuesses,
    turns,
  };
}

/**
 * Submit building height (1-5 feet)
 */
export function submitBuildingHeight(
  state: TowerOfTenState,
  tribeId: string,
  height: number
): { success: boolean; message: string; newState: TowerOfTenState } {
  if (state.phase !== 'building') {
    return {
      success: false,
      message: 'Not in building phase',
      newState: state,
    };
  }

  if (height < 1 || height > 5) {
    return {
      success: false,
      message: 'Height must be between 1 and 5 feet',
      newState: state,
    };
  }

  // Record submission
  state.tribeSubmissions[tribeId]?.push(height);

  // Check if all tribes have submitted
  const allSubmitted = Object.values(state.tribeSubmissions).every(
    (subs) => subs.length > 0
  );

  if (!allSubmitted) {
    return {
      success: true,
      message: `Submitted ${height} feet. Waiting for other tribes...`,
      newState: state,
    };
  }

  // Process this round
  const newState = processBuilding Round(state);

  return {
    success: true,
    message: 'Building round complete!',
    newState,
  };
}

/**
 * Process building round - check for matches and update heights
 */
function processBuildingRound(state: TowerOfTenState): TowerOfTenState {
  const submissions = Object.entries(state.tribeSubmissions).map(([tribeId, heights]) => ({
    tribeId,
    height: heights[heights.length - 1]!,
  }));

  // Check for duplicates
  const heightCounts = new Map<number, number>();
  for (const { height } of submissions) {
    heightCounts.set(height, (heightCounts.get(height) || 0) + 1);
  }

  // Apply gains (matching heights = zero gain)
  for (const { tribeId, height } of submissions) {
    const count = heightCounts.get(height)!;
    const gain = count === 1 ? height : 0; // Only gain if unique
    state.tribeHeights[tribeId] = (state.tribeHeights[tribeId] || 0) + gain;
    state.turns[tribeId] = (state.turns[tribeId] || 0) + 1;
  }

  // Check if any tribe reached goal
  const anyReachedGoal = Object.values(state.tribeHeights).some((h) => h >= TOWER_HEIGHT_GOAL);

  if (anyReachedGoal) {
    state.phase = 'puzzle';
  }

  // Clear submissions for next round
  for (const tribeId in state.tribeSubmissions) {
    state.tribeSubmissions[tribeId] = [];
  }

  return state;
}

/**
 * Submit puzzle guess
 */
export function submitPuzzleGuess(
  state: TowerOfTenState,
  tribeId: string,
  guess: string[]
): { success: boolean; message: string; feedback: string; newState: TowerOfTenState } {
  if (state.phase !== 'puzzle') {
    return {
      success: false,
      message: 'Not in puzzle phase',
      feedback: '',
      newState: state,
    };
  }

  if (guess.length !== PUZZLE_LENGTH) {
    return {
      success: false,
      message: `Puzzle must be ${PUZZLE_LENGTH} emojis long`,
      feedback: '',
      newState: state,
    };
  }

  // Check if all emojis are valid
  const allValid = guess.every((emoji) => EMOJI_OPTIONS.includes(emoji));
  if (!allValid) {
    return {
      success: false,
      message: 'Invalid emoji in guess',
      feedback: '',
      newState: state,
    };
  }

  // Calculate feedback (number of correct positions)
  const correctPositions = guess.filter(
    (emoji, idx) => emoji === state.puzzleSolution[idx]
  ).length;

  const feedback = `${correctPositions} correct position${correctPositions !== 1 ? 's' : ''}`;

  // Record guess
  state.puzzleGuesses[tribeId]?.push({ guess, feedback });
  state.turns[tribeId] = (state.turns[tribeId] || 0) + 1;

  // Check if solved
  if (correctPositions === PUZZLE_LENGTH) {
    state.phase = 'complete';
    return {
      success: true,
      message: '🎉 Puzzle solved!',
      feedback,
      newState: state,
    };
  }

  return {
    success: true,
    message: 'Guess recorded',
    feedback,
    newState: state,
  };
}

/**
 * Get challenge results
 */
export function getTowerOfTenResults(state: TowerOfTenState): {
  winner: string | null;
  loser: string | null;
  placements: Array<{ tribeId: string; turns: number; placement: number }>;
} {
  if (state.phase !== 'complete') {
    return {
      winner: null,
      loser: null,
      placements: [],
    };
  }

  // Sort tribes by turns (fewest = best)
  const placements = Object.entries(state.turns)
    .map(([tribeId, turns]) => ({ tribeId, turns }))
    .sort((a, b) => a.turns - b.turns)
    .map((entry, idx) => ({ ...entry, placement: idx + 1 }));

  const winner = placements[0]?.tribeId || null;
  const loser = placements[placements.length - 1]?.tribeId || null;

  return {
    winner,
    loser,
    placements,
  };
}

/**
 * Get current standings (for display during challenge)
 */
export function getTowerStandings(state: TowerOfTenState): Array<{
  tribeId: string;
  height: number;
  puzzleSolved: boolean;
  turns: number;
}> {
  return Object.keys(state.tribeHeights).map((tribeId) => ({
    tribeId,
    height: state.tribeHeights[tribeId] || 0,
    puzzleSolved:
      state.phase === 'complete' &&
      state.puzzleGuesses[tribeId]?.some(
        (g) => g.feedback === `${PUZZLE_LENGTH} correct positions`
      ) ||
      false,
    turns: state.turns[tribeId] || 0,
  }));
}
