'use client';

import { useState, useEffect } from 'react';

interface Challenge {
  id: string;
  day: number;
  type: 'team' | 'individual';
  encountersJson: any;
  scoredAt: Date | null;
}

interface ChallengeInterfaceProps {
  playerId: string;
  playerName: string;
  seasonId: string;
  currentDay: number;
  challenge: Challenge | null;
  challengeEndsAt: Date;
}

export function ChallengeInterface({
  playerId,
  playerName,
  seasonId,
  currentDay,
  challenge,
  challengeEndsAt,
}: ChallengeInterfaceProps) {
  const [clientSeed, setClientSeed] = useState('');
  const [clientSeedHash, setClientSeedHash] = useState('');
  const [committed, setCommitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    // Generate client seed on mount
    generateSeed();
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = challengeEndsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Challenge locked');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [challengeEndsAt]);

  const generateSeed = async () => {
    // Generate random seed
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const seed = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    setClientSeed(seed);

    // Generate hash
    const encoder = new TextEncoder();
    const data = encoder.encode(seed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
    setClientSeedHash(hash);
  };

  const handleCommit = async () => {
    if (!challenge || !clientSeedHash) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/challenge/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          challengeId: challenge.id,
          clientSeedHash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to commit');
      }

      setCommitted(true);
      setMessage({
        type: 'success',
        text: 'Seed committed successfully! Save your seed for verification.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to commit seed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!challenge) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚔️</div>
        <h1 className="text-2xl font-bold mb-2">Challenge Phase</h1>
        <p className="text-gray-600 dark:text-gray-400">
          No challenge available yet. Check back when the phase begins!
        </p>
      </div>
    );
  }

  if (challenge.scoredAt) {
    return (
      <div className="space-y-6">
        <div className="bg-green-600 text-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">⚔️ Challenge Complete</h1>
          <p className="text-green-100">Results have been tallied!</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Challenge Results</h2>
          <p className="text-gray-600 dark:text-gray-400">
            The challenge has been scored. Check the event log for detailed results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">⚔️ Challenge Phase</h1>
            <p className="text-blue-100">
              {challenge.type === 'team' ? 'Team Challenge' : 'Individual Challenge'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Commit Deadline</p>
            <p className="text-2xl font-mono font-bold" aria-live="polite">
              {timeRemaining}
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Commit Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Commit Your Seed</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Your Client Seed</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={clientSeed}
                readOnly
                className="flex-1 px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
              />
              <button
                onClick={() => navigator.clipboard.writeText(clientSeed)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded font-semibold"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Save this seed! You'll need it to verify your results.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              SHA256 Hash (Commitment)
            </label>
            <input
              type="text"
              value={clientSeedHash}
              readOnly
              className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              This hash is submitted to prove you committed before seeing server seed
            </p>
          </div>

          {!committed ? (
            <button
              onClick={handleCommit}
              disabled={submitting || !clientSeedHash}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Committing...' : 'Commit Seed'}
            </button>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 font-semibold">
                ✓ Seed committed successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Results will be calculated after the challenge phase ends.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
        <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-3">
          🎲 How Fair RNG Works
        </h3>
        <ol className="text-sm text-purple-800 dark:text-purple-200 space-y-2 list-decimal list-inside">
          <li>
            <strong>Commit Phase:</strong> You generate a random seed and submit its hash
          </li>
          <li>
            <strong>Lock Phase:</strong> Server generates its own secret seed
          </li>
          <li>
            <strong>Reveal & Score:</strong> Both seeds are combined to generate your roll
          </li>
          <li>
            <strong>Verification:</strong> All seeds are published so anyone can verify the results
          </li>
        </ol>
        <p className="text-xs text-purple-700 dark:text-purple-300 mt-3">
          This commit-reveal protocol ensures neither you nor the server can manipulate results.
        </p>
      </div>

      {/* Stats Impact */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
          📊 Challenge Scoring
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Base: D20 roll (1-20)</li>
          <li>Energy bonus: +{'{'}floor(energy/20){'}'} (0-5)</li>
          <li>Hunger/thirst penalties if below 30</li>
          <li>Item bonuses from tools and advantages</li>
          <li>Team challenges use top player scores</li>
        </ul>
      </div>
    </div>
  );
}
