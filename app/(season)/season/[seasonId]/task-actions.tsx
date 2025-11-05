'use client';

import { useState } from 'react';

interface TaskActionsProps {
  playerId: string;
  currentPhase: 'camp' | 'challenge' | 'vote';
  playerClass?: string;
  wildcardAbility?: string;
}

export function TaskActions({ playerId, currentPhase, playerClass, wildcardAbility }: TaskActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const performAction = async (action: string) => {
    setLoading(action);
    setMessage(null);

    try {
      const response = await fetch('/api/camp/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      // Build success message from result
      let successText = data.message || 'Action completed!';

      if (data.statChanges) {
        const changes = [];
        if (data.statChanges.hunger) changes.push(`Hunger ${data.statChanges.hunger > 0 ? '+' : ''}${data.statChanges.hunger}`);
        if (data.statChanges.thirst) changes.push(`Thirst ${data.statChanges.thirst > 0 ? '+' : ''}${data.statChanges.thirst}`);
        if (data.statChanges.comfort) changes.push(`Comfort ${data.statChanges.comfort > 0 ? '+' : ''}${data.statChanges.comfort}`);
        if (data.statChanges.energy) changes.push(`Energy ${data.statChanges.energy > 0 ? '+' : ''}${data.statChanges.energy}`);

        if (changes.length > 0) {
          successText += ` (${changes.join(', ')})`;
        }
      }

      if (data.items && data.items.length > 0) {
        successText += ` 🎁 ${data.items.join(', ')}`;
      }

      setMessage({ type: 'success', text: successText });

      // Refresh page to show updated stats
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Action failed',
      });
    } finally {
      setLoading(null);
    }
  };

  if (currentPhase !== 'camp') {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Actions are only available during Camp Phase
        </p>
      </div>
    );
  }

  const isSurvivalist = playerClass === 'survivalist' ||
    (playerClass === 'wildcard' && wildcardAbility === 'survivalist');

  const actions = [
    {
      id: 'collect_firewood',
      label: 'Collect Firewood',
      icon: '🪵',
      description: 'Gather firewood (tribe inventory, -10 energy)',
      color: 'bg-amber-600 hover:bg-amber-700',
      category: 'gather',
    },
    {
      id: 'gather_coconuts',
      label: 'Gather Coconuts',
      icon: '🥥',
      description: 'Find coconuts (tribe inventory, -10 energy)',
      color: 'bg-orange-600 hover:bg-orange-700',
      category: 'gather',
    },
    {
      id: 'spear_fish',
      label: 'Spear Fish',
      icon: '🐟',
      description: `Catch fish (requires spear, ${isSurvivalist ? '+10% bonus' : '40% success'})`,
      color: 'bg-blue-600 hover:bg-blue-700',
      category: 'gather',
    },
    {
      id: 'build_shelter',
      label: 'Build Shelter',
      icon: '🏠',
      description: 'Improve shelter (requires 3 firewood, +comfort)',
      color: 'bg-green-600 hover:bg-green-700',
      category: 'improve',
    },
    {
      id: 'get_water',
      label: 'Get Water',
      icon: '💧',
      description: 'Gather drinking water (+thirst)',
      color: 'bg-cyan-600 hover:bg-cyan-700',
      category: 'improve',
    },
    {
      id: 'cook_food',
      label: 'Cook Food',
      icon: '🍲',
      description: 'Cook a meal (requires firewood + food, +hunger)',
      color: 'bg-red-600 hover:bg-red-700',
      category: 'improve',
    },
    {
      id: 'rest',
      label: 'Rest',
      icon: '😴',
      description: 'Take a break (+comfort, +energy)',
      color: 'bg-purple-600 hover:bg-purple-700',
      category: 'recover',
    },
    {
      id: 'meditate',
      label: 'Meditate',
      icon: '🧘',
      description: 'Focus your mind (+energy, requires good stats)',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      category: 'recover',
    },
    {
      id: 'search_advantages',
      label: 'Search for Advantages',
      icon: '🔍',
      description: `Find hidden advantages (${isSurvivalist ? '43%' : '33%'} success)`,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      category: 'strategic',
    },
  ];

  const gatherActions = actions.filter(a => a.category === 'gather');
  const improveActions = actions.filter(a => a.category === 'improve');
  const recoverActions = actions.filter(a => a.category === 'recover');
  const strategicActions = actions.filter(a => a.category === 'strategic');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Camp Actions</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Perform actions to gather resources, improve your stats, or search for advantages
        </p>
      </div>

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

      {/* Gather Actions */}
      <div>
        <h4 className="text-lg font-semibold mb-3">🌴 Gather Resources</h4>
        <div className="grid sm:grid-cols-3 gap-3">
          {gatherActions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              loading={loading}
              onPerform={performAction}
            />
          ))}
        </div>
      </div>

      {/* Improve Actions */}
      <div>
        <h4 className="text-lg font-semibold mb-3">🔨 Improve Camp</h4>
        <div className="grid sm:grid-cols-3 gap-3">
          {improveActions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              loading={loading}
              onPerform={performAction}
            />
          ))}
        </div>
      </div>

      {/* Recover Actions */}
      <div>
        <h4 className="text-lg font-semibold mb-3">💆 Recover</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {recoverActions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              loading={loading}
              onPerform={performAction}
            />
          ))}
        </div>
      </div>

      {/* Strategic Actions */}
      <div>
        <h4 className="text-lg font-semibold mb-3">🎯 Strategic</h4>
        <div className="grid sm:grid-cols-1 gap-3">
          {strategicActions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              loading={loading}
              onPerform={performAction}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <span className="font-bold">💡 Tips:</span><br />
            • Gathering adds to tribe inventory (shared resources)<br />
            • Personal inventory holds your advantages and unique items<br />
            • Most actions cost energy - watch your stats!<br />
            • Survivalists get +10% bonus on fishing and advantage finding
          </p>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  action: {
    id: string;
    label: string;
    icon: string;
    description: string;
    color: string;
  };
  loading: string | null;
  onPerform: (action: string) => void;
}

function ActionButton({ action, loading, onPerform }: ActionButtonProps) {
  return (
    <button
      onClick={() => onPerform(action.id)}
      disabled={loading !== null}
      className={`${action.color} text-white rounded-lg p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
    >
      <div className="text-3xl mb-2">{action.icon}</div>
      <div className="font-bold mb-1 text-sm">{action.label}</div>
      <div className="text-xs opacity-90 leading-tight">{action.description}</div>
      {loading === action.id && (
        <div className="mt-2">
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
        </div>
      )}
    </button>
  );
}
