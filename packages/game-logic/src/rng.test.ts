import { describe, it, expect } from 'vitest';
import {
  generateClientCommit,
  generateServerSeed,
  verifyClientCommit,
  generateRoll,
  verifyRolls,
} from './rng';

describe('RNG - Commit-Reveal Protocol', () => {
  it('should generate valid client commit', () => {
    const { seed, hash } = generateClientCommit();

    expect(seed).toBeTruthy();
    expect(hash).toBeTruthy();
    expect(seed).not.toBe(hash);
    expect(hash).toHaveLength(64); // SHA256 hex = 64 chars
  });

  it('should verify valid client commit', () => {
    const { seed, hash } = generateClientCommit();
    expect(verifyClientCommit(seed, hash)).toBe(true);
  });

  it('should reject invalid client commit', () => {
    const { seed } = generateClientCommit();
    const wrongHash = 'a'.repeat(64);
    expect(verifyClientCommit(seed, wrongHash)).toBe(false);
  });

  it('should generate server seed', () => {
    const seed = generateServerSeed();
    expect(seed).toBeTruthy();
    expect(seed).toHaveLength(64); // 32 bytes hex
  });

  it('should generate deterministic roll in 1-20 range', () => {
    const serverSeed = 'server123';
    const clientSeed = 'client456';
    const encounterId = 'encounter1';
    const subjectId = 'player1';

    const roll1 = generateRoll(serverSeed, clientSeed, encounterId, subjectId);
    const roll2 = generateRoll(serverSeed, clientSeed, encounterId, subjectId);

    expect(roll1).toBe(roll2); // Deterministic
    expect(roll1).toBeGreaterThanOrEqual(1);
    expect(roll1).toBeLessThanOrEqual(20);
  });

  it('should generate different rolls for different players', () => {
    const serverSeed = 'server123';
    const clientSeed = 'client456';
    const encounterId = 'encounter1';

    const roll1 = generateRoll(serverSeed, clientSeed, encounterId, 'player1');
    const roll2 = generateRoll(serverSeed, clientSeed, encounterId, 'player2');

    // Very unlikely to be same (1/20 chance)
    expect(roll1).not.toBe(roll2);
  });

  it('should verify rolls correctly', () => {
    const { seed: clientSeed, hash: clientSeedHash } = generateClientCommit();
    const serverSeed = generateServerSeed();
    const encounterId = 'encounter1';

    const expectedRolls = new Map([
      ['player1', generateRoll(serverSeed, clientSeed, encounterId, 'player1')],
      ['player2', generateRoll(serverSeed, clientSeed, encounterId, 'player2')],
    ]);

    const result = verifyRolls(serverSeed, clientSeed, clientSeedHash, encounterId, expectedRolls);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect tampered rolls', () => {
    const { seed: clientSeed, hash: clientSeedHash } = generateClientCommit();
    const serverSeed = generateServerSeed();
    const encounterId = 'encounter1';

    const expectedRolls = new Map([
      ['player1', 15], // Wrong value
      ['player2', generateRoll(serverSeed, clientSeed, encounterId, 'player2')],
    ]);

    const result = verifyRolls(serverSeed, clientSeed, clientSeedHash, encounterId, expectedRolls);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
