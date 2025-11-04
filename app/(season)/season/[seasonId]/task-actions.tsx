'use client';

import { useState } from 'react';

interface TaskActionsProps {
  playerId: string;
  currentPhase: 'camp' | 'challenge' | 'vote';
}

export function TaskActions({ playerId, currentPhase }: TaskActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const performTask = async (taskType: string) => {
    setLoading(taskType);
    setMessage(null);

    try {
      const response = await fetch(`/api/task/${taskType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Task failed');
      }

      // Show success message
      let successText = '';
      if (taskType === 'forage') {
        successText = `Foraged! +${data.delta.hunger} hunger`;
        if (data.item) {
          successText += ` 🎉 Found a ${data.item.type}!`;
        }
      } else if (taskType === 'water') {
        successText = `Water gathered! +${data.delta.thirst} thirst`;
        if (data.debuff) {
          successText += ` ⚠️ ${data.debuff}`;
        }
      } else if (taskType === 'rest') {
        successText = `Rested! +${data.delta.energy} energy`;
      }

      setMessage({ type: 'success', text: successText });

      // Refresh page to show updated stats
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Task failed',
      });
    } finally {
      setLoading(null);
    }
  };

  if (currentPhase !== 'camp') {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Tasks are only available during Camp Phase
        </p>
      </div>
    );
  }

  const tasks = [
    {
      id: 'forage',
      label: 'Forage',
      icon: '🍎',
      description: 'Search for food (+10-25 hunger, -5 energy)',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      id: 'water',
      label: 'Get Water',
      icon: '💧',
      description: 'Gather water (+15-35 thirst, 10% tainted)',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'rest',
      label: 'Rest',
      icon: '😴',
      description: 'Take a break (+20-30 energy)',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Camp Actions</h3>

      {message && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => performTask(task.id)}
            disabled={loading !== null}
            className={`${task.color} text-white rounded-lg p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="text-3xl mb-2">{task.icon}</div>
            <div className="font-bold mb-1">{task.label}</div>
            <div className="text-xs opacity-90">{task.description}</div>
            {loading === task.id && (
              <div className="mt-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-semibold mb-2">Help a Tribe Mate</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Build social bonds by helping others (+5-10 social to target)
        </p>
        <HelpPlayerSelect playerId={playerId} />
      </div>
    </div>
  );
}

function HelpPlayerSelect({ playerId }: { playerId: string }) {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleHelp = async () => {
    if (!selectedPlayer) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/task/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, targetPlayerId: selectedPlayer }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to help');
      }

      setMessage(`Helped! +${data.delta.social} social for your ally`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to help');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <select
        value={selectedPlayer}
        onChange={(e) => setSelectedPlayer(e.target.value)}
        className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
        disabled={loading}
      >
        <option value="">Select a tribe mate...</option>
        {/* In real app, populate with tribe members */}
        <option value="player-2">Player 2</option>
        <option value="player-3">Player 3</option>
      </select>
      <button
        onClick={handleHelp}
        disabled={!selectedPlayer || loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Helping...' : 'Help Player'}
      </button>
      {message && (
        <p className="text-sm text-center text-green-600 dark:text-green-400">{message}</p>
      )}
    </div>
  );
}
