'use client';

import { useState, useEffect } from 'react';

interface Target {
  id: string;
  name: string;
  handle: string;
}

interface VoteInterfaceProps {
  playerId: string;
  seasonId: string;
  currentDay: number;
  eligibleTargets: Target[];
  currentVote: string | null;
  voteEndsAt: Date;
}

export function VoteInterface({
  playerId,
  seasonId,
  currentDay,
  eligibleTargets,
  currentVote,
  voteEndsAt,
}: VoteInterfaceProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>(currentVote || '');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = voteEndsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Voting closed');
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
  }, [voteEndsAt]);

  const handleSubmit = async () => {
    if (!selectedTarget) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: playerId,
          targetPlayerId: selectedTarget,
          day: currentDay,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote');
      }

      setMessage({
        type: 'success',
        text: currentVote
          ? 'Vote changed successfully'
          : 'Vote submitted successfully',
      });
      setConfirming(false);

      // Refresh after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to vote',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (eligibleTargets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🔥</div>
        <h1 className="text-2xl font-bold mb-2">Tribal Council</h1>
        <p className="text-gray-600 dark:text-gray-400">
          No eligible players to vote for at this time
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-red-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔥 Tribal Council</h1>
            <p className="text-red-100">
              Vote to eliminate a player. You can change your vote until time runs out.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Time Remaining</p>
            <p className="text-2xl font-mono font-bold" aria-live="polite">
              {timeRemaining}
            </p>
          </div>
        </div>
      </div>

      {/* Current Vote Status */}
      {currentVote && !confirming && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            ✓ You have already voted. You can change your vote below.
          </p>
        </div>
      )}

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

      {/* Vote Selection */}
      {!confirming ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Select a Player to Eliminate</h2>

          <div className="space-y-3">
            {eligibleTargets.map((target) => {
              const isSelected = selectedTarget === target.id;
              const isCurrentVote = currentVote === target.id;

              return (
                <button
                  key={target.id}
                  onClick={() => setSelectedTarget(target.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{target.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{target.handle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrentVote && (
                        <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                          Current Vote
                        </span>
                      )}
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-red-600 bg-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setConfirming(true)}
            disabled={!selectedTarget}
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentVote ? 'Change Vote' : 'Cast Vote'}
          </button>
        </div>
      ) : (
        /* Confirmation */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Your Vote</h2>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">You are voting for:</p>
            <p className="text-2xl font-bold">
              {eligibleTargets.find((t) => t.id === selectedTarget)?.name}
            </p>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            ⚠️ This vote will be recorded. You can change it before the deadline.
            After voting closes, your vote will be revealed and tallied.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirming(false)}
              disabled={submitting}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 py-3 rounded-lg font-bold transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Confirm Vote'}
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
          💡 Voting Rules
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Players with immunity cannot be eliminated</li>
          <li>You can change your vote until the deadline</li>
          <li>Immunity idols can be played to negate votes</li>
          <li>In case of a tie, there will be a revote or fire-making challenge</li>
          <li>Your vote will be revealed after the voting phase closes</li>
        </ul>
      </div>
    </div>
  );
}
