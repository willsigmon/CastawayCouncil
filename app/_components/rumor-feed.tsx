'use client';

import { useEffect, useState } from 'react';

interface Rumor {
  id: string;
  content: string;
  targetPlayer?: {
    id: string;
    name: string;
  } | null;
  day: number;
  expiresAt: Date | null;
  visibleTo: string;
}

interface RumorFeedProps {
  seasonId: string;
  playerId?: string;
}

export function RumorFeed({ seasonId, playerId }: RumorFeedProps) {
  const [rumors, setRumors] = useState<Rumor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRumors = async () => {
      try {
        const url = new URL('/api/rumors', window.location.origin);
        url.searchParams.set('seasonId', seasonId);
        if (playerId) url.searchParams.set('playerId', playerId);

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setRumors(data.rumors || []);
        }
      } catch (error) {
        console.error('Failed to fetch rumors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRumors();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRumors, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [seasonId, playerId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">💭 Camp Rumors</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (rumors.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">💭 Camp Rumors</h3>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          No rumors circulating... yet. Keep your ears open!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">💭 Camp Rumors</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {rumors.length} active {rumors.length === 1 ? 'rumor' : 'rumors'}
        </span>
      </div>

      <div className="space-y-3">
        {rumors.map((rumor) => (
          <RumorCard key={rumor.id} rumor={rumor} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ⚠️ Not all rumors are true. Use your judgment and verify information before acting on it.
        </p>
      </div>
    </div>
  );
}

function RumorCard({ rumor }: { rumor: Rumor }) {
  const getVisibilityLabel = (visibleTo: string) => {
    if (visibleTo === 'all') return 'Everyone knows';
    if (visibleTo.startsWith('tribe:')) return 'Your tribe';
    if (visibleTo.startsWith('player:')) return 'Private';
    return 'Unknown';
  };

  const getVisibilityColor = (visibleTo: string) => {
    if (visibleTo === 'all') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    if (visibleTo.startsWith('tribe:')) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
  };

  const getDaysRemaining = (expiresAt: Date | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysRemaining = getDaysRemaining(rumor.expiresAt);

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💭</span>
          <span
            className={`text-xs px-2 py-1 rounded ${getVisibilityColor(rumor.visibleTo)}`}
          >
            {getVisibilityLabel(rumor.visibleTo)}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Day {rumor.day}</div>
      </div>

      <p className="text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">
        {rumor.content}
      </p>

      {rumor.targetPlayer && (
        <div className="text-sm text-purple-700 dark:text-purple-400 mb-2">
          About: <span className="font-semibold">{rumor.targetPlayer.name}</span>
        </div>
      )}

      {daysRemaining !== null && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
        </div>
      )}
    </div>
  );
}
