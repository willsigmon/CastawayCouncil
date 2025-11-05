'use client';

import { useEffect, useState } from 'react';

interface Relationship {
  targetPlayer: {
    id: string;
    name: string;
    handle: string;
  };
  trustLevel: number;
  allianceStrength: number;
  interactions: number;
  votedTogether: number;
  votedAgainst: number;
  tier: 'enemy' | 'stranger' | 'acquaintance' | 'friend' | 'close_ally' | 'final_two';
  tierDescription: string;
  tierColor: string;
}

interface NaturalAlliance {
  allyId: string;
  strength: number;
  suggested: boolean;
}

interface TrustMeterProps {
  playerId: string;
}

const tierIcons: Record<string, string> = {
  enemy: '💔',
  stranger: '❓',
  acquaintance: '👋',
  friend: '🤝',
  close_ally: '💙',
  final_two: '💜',
};

const tierColors: Record<string, string> = {
  red: 'from-red-500 to-red-700',
  gray: 'from-gray-400 to-gray-600',
  yellow: 'from-yellow-500 to-amber-600',
  green: 'from-green-500 to-emerald-600',
  blue: 'from-blue-500 to-blue-700',
  purple: 'from-purple-500 to-purple-700',
};

export function TrustMeter({ playerId }: TrustMeterProps) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [alliances, setAlliances] = useState<NaturalAlliance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const url = new URL('/api/relationships', window.location.origin);
        url.searchParams.set('playerId', playerId);
        url.searchParams.set('analysis', 'false');

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setRelationships(data.relationships || []);
          setAlliances(data.naturalAlliances || []);
        }
      } catch (error) {
        console.error('Failed to fetch relationships:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelationships();
  }, [playerId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">🤝 Relationships</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (relationships.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">🤝 Relationships</h3>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          No relationships yet. Start interacting with other players!
        </p>
      </div>
    );
  }

  // Sort by alliance strength (strongest first)
  const sortedRelationships = [...relationships].sort(
    (a, b) => b.allianceStrength - a.allianceStrength
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">🤝 Relationships</h3>

      {/* Alliance Suggestions */}
      {alliances.length > 0 && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            💡 Natural Alliances
          </h4>
          <div className="space-y-2">
            {alliances.slice(0, 3).map((alliance) => {
              const rel = relationships.find(
                (r) => r.targetPlayer.id === alliance.allyId
              );
              return (
                <div
                  key={alliance.allyId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-blue-800 dark:text-blue-200">
                    {rel?.targetPlayer.name || 'Unknown'}
                  </span>
                  <span className="text-blue-700 dark:text-blue-300 font-semibold">
                    {alliance.strength}% strength
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Relationships List */}
      <div className="space-y-3">
        {sortedRelationships.map((rel) => (
          <RelationshipCard key={rel.targetPlayer.id} relationship={rel} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Build trust through conversations, voting together, and sharing resources. Watch out
          for betrayals!
        </p>
      </div>
    </div>
  );
}

function RelationshipCard({ relationship }: { relationship: Relationship }) {
  const tierIcon = tierIcons[relationship.tier] || '❓';
  const gradientColor = tierColors[relationship.tierColor] || tierColors.gray;

  return (
    <div
      className={`bg-gradient-to-r ${gradientColor} text-white rounded-lg p-4 shadow-md`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{tierIcon}</span>
            <div>
              <p className="font-bold">{relationship.targetPlayer.name}</p>
              <p className="text-xs opacity-90">@{relationship.targetPlayer.handle}</p>
            </div>
          </div>
          <p className="text-sm opacity-90">{relationship.tierDescription}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* Trust Level */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 opacity-90">
            <span>Trust</span>
            <span>{relationship.trustLevel}%</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-white h-full rounded-full transition-all"
              style={{ width: `${relationship.trustLevel}%` }}
            />
          </div>
        </div>

        {/* Alliance Strength */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 opacity-90">
            <span>Alliance</span>
            <span>{relationship.allianceStrength}%</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-white h-full rounded-full transition-all"
              style={{ width: `${relationship.allianceStrength}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs opacity-90 border-t border-white/30 pt-2">
        <span>{relationship.interactions} interactions</span>
        <div className="flex gap-3">
          <span className="text-green-200">✓ {relationship.votedTogether}</span>
          {relationship.votedAgainst > 0 && (
            <span className="text-red-200">✗ {relationship.votedAgainst}</span>
          )}
        </div>
      </div>
    </div>
  );
}
