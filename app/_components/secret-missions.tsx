'use client';

import { useEffect, useState } from 'react';

type MissionType =
  | 'vote_for'
  | 'vote_against'
  | 'alliance_with'
  | 'avoid_player'
  | 'gather_resources'
  | 'win_challenge'
  | 'find_advantage'
  | 'build_upgrade'
  | 'help_player'
  | 'sabotage';

interface SecretMission {
  id: string;
  title: string;
  description: string;
  objective: {
    type: MissionType;
    target?: string;
    quantity?: number;
  };
  reward: {
    statBonus?: {
      hunger?: number;
      thirst?: number;
      comfort?: number;
      energy?: number;
    };
    insightPoints?: number;
    advantage?: boolean;
    immunity?: boolean;
    extraVote?: boolean;
    influence?: number;
  };
  status: 'assigned' | 'in_progress' | 'completed';
  expiresAt: Date;
  day: number;
}

interface SecretMissionsProps {
  playerId: string;
}

const missionIcons: Record<MissionType, string> = {
  vote_for: '🗳️',
  vote_against: '🚫',
  alliance_with: '🤝',
  avoid_player: '🚶',
  gather_resources: '🌾',
  win_challenge: '🏆',
  find_advantage: '🔍',
  build_upgrade: '🏗️',
  help_player: '❤️',
  sabotage: '💣',
};

const statusColors = {
  assigned: 'from-blue-500 to-indigo-600',
  in_progress: 'from-orange-500 to-amber-600',
  completed: 'from-green-500 to-emerald-600',
};

export function SecretMissions({ playerId }: SecretMissionsProps) {
  const [missions, setMissions] = useState<SecretMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const url = new URL('/api/missions', window.location.origin);
        url.searchParams.set('playerId', playerId);

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setMissions(data.missions || []);
        }
      } catch (error) {
        console.error('Failed to fetch missions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
    // Refresh every minute
    const interval = setInterval(fetchMissions, 60 * 1000);
    return () => clearInterval(interval);
  }, [playerId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">🎯 Secret Missions</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const activeMissions = missions.filter(
    (m) => m.status === 'assigned' || m.status === 'in_progress'
  );
  const completedMissions = missions.filter((m) => m.status === 'completed');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">🎯 Secret Missions</h3>
        {completedMissions.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completedMissions.length})
          </button>
        )}
      </div>

      {activeMissions.length === 0 && !showCompleted && (
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg p-6 text-center">
          <p className="text-purple-800 dark:text-purple-200 mb-2">
            No active missions right now
          </p>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Check back later for new secret objectives!
          </p>
        </div>
      )}

      <div className="space-y-3">
        {activeMissions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}

        {showCompleted &&
          completedMissions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          🤫 Keep missions secret for bonus rewards! Completing objectives earns insight points
          and other valuable benefits.
        </p>
      </div>
    </div>
  );
}

function MissionCard({ mission }: { mission: SecretMission }) {
  const icon = missionIcons[mission.objective.type] || '🎯';
  const gradient = statusColors[mission.status];

  const getTimeRemaining = () => {
    const now = Date.now();
    const expires = new Date(mission.expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    return `${hours}h remaining`;
  };

  const getRewardSummary = () => {
    const parts: string[] = [];
    if (mission.reward.insightPoints) {
      parts.push(`${mission.reward.insightPoints} insight points`);
    }
    if (mission.reward.advantage) parts.push('Advantage');
    if (mission.reward.immunity) parts.push('One-time immunity');
    if (mission.reward.extraVote) parts.push('Extra vote');
    if (mission.reward.influence) parts.push(`+${mission.reward.influence} jury influence`);
    if (mission.reward.statBonus) {
      const stats = Object.entries(mission.reward.statBonus)
        .filter(([_, v]) => v && v > 0)
        .map(([k, v]) => `+${v} ${k}`);
      if (stats.length > 0) parts.push(stats.join(', '));
    }
    return parts.join(' • ');
  };

  return (
    <div
      className={`bg-gradient-to-r ${gradient} text-white rounded-lg p-4 shadow-md border-2 border-white/30`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h4 className="font-bold text-lg">{mission.title}</h4>
            <p className="text-xs opacity-90 capitalize">{mission.status.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-90">Day {mission.day}</p>
          <p className="text-xs font-semibold">{getTimeRemaining()}</p>
        </div>
      </div>

      <p className="text-sm opacity-95 mb-3 leading-relaxed">{mission.description}</p>

      <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
        <p className="text-xs font-semibold mb-1 opacity-90">Rewards:</p>
        <p className="text-sm">{getRewardSummary()}</p>
      </div>

      {mission.status === 'completed' && (
        <div className="mt-3 pt-3 border-t border-white/30">
          <p className="text-sm font-bold">✅ Mission Completed!</p>
        </div>
      )}
    </div>
  );
}
