import crypto from 'node:crypto';

/**
 * Commit-reveal RNG system for fair, verifiable random number generation
 */

export interface CommitRevealSeed {
  clientSeed: string;
  serverSeed: string;
  clientSeedHash: string;
}

/**
 * Client generates a random seed and commits to it via SHA256 hash
 */
export function generateClientCommit(): { seed: string; hash: string } {
  const seed = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return { seed, hash };
}

/**
 * Server generates its own random seed
 */
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify that a client seed matches its committed hash
 */
export function verifyClientCommit(seed: string, hash: string): boolean {
  const computedHash = crypto.createHash('sha256').update(seed).digest('hex');
  return computedHash === hash;
}

/**
 * Generate a deterministic roll from seeds and identifiers
 * Maps to 1-20 (inclusive) like a D20 die
 */
export function generateRoll(
  serverSeed: string,
  clientSeed: string,
  encounterId: string,
  subjectId: string
): number {
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(`${clientSeed}:${encounterId}:${subjectId}`);
  const hash = hmac.digest();

  // Use first 4 bytes as uint32
  const value = hash.readUInt32BE(0);

  // Map to 1-20 range
  return (value % 20) + 1;
}

/**
 * Generate multiple rolls for a team challenge
 */
export function generateTeamRolls(
  serverSeed: string,
  clientSeed: string,
  encounterId: string,
  playerIds: string[]
): Map<string, number> {
  const rolls = new Map<string, number>();

  for (const playerId of playerIds) {
    rolls.set(playerId, generateRoll(serverSeed, clientSeed, encounterId, playerId));
  }

  return rolls;
}

/**
 * Replay verification - given published seeds, verify rolls match
 */
export function verifyRolls(
  serverSeed: string,
  clientSeed: string,
  clientSeedHash: string,
  encounterId: string,
  expectedRolls: Map<string, number>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verify client commit
  if (!verifyClientCommit(clientSeed, clientSeedHash)) {
    errors.push('Client seed does not match committed hash');
  }

  // Verify each roll
  for (const [subjectId, expectedRoll] of expectedRolls.entries()) {
    const actualRoll = generateRoll(serverSeed, clientSeed, encounterId, subjectId);
    if (actualRoll !== expectedRoll) {
      errors.push(
        `Roll mismatch for ${subjectId}: expected ${expectedRoll}, got ${actualRoll}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
