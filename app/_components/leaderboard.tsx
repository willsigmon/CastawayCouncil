'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  tier: string;
  tierColor: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    winRate: number;
    challengesWon: number;
    advantagesFound: number;
    totalInsightPoints: number;
    daysPlayed: number;
  };
  value: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
  max?: number;
}

interface UserPosition {
  rank: number;
  tier: string;
  tierDescription: string;
  stats: any;
  percentiles: {
    wins: number;
    challenges: number;
    insights: number;
  };
  achievements: Achievement[];
}

interface LeaderboardProps {
  userId?: string;
}

export function Leaderboard({ userId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [selectedStat, setSelectedStat] = useState<string>('wins');
  const [isLoading, setIsLoading] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedStat, userId]);

  async function fetchLeaderboard() {
    setIsLoading(true);
    try {
      const url = new URL('/api/leaderboard', window.location.origin);
      url.searchParams.set('stat', selectedStat);
      url.searchParams.set('limit', '50');
      if (userId) {
        url.searchParams.set('userId', userId);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (response.ok) {
        setLeaderboard(data.leaderboard);
        setTotalPlayers(data.totalPlayers);
        setUserPosition(data.userPosition);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const stats = [
    { value: 'wins', label: 'Total Wins', icon: '🏆' },
    { value: 'winRate', label: 'Win Rate', icon: '📊' },
    { value: 'challengesWon', label: 'Challenges Won', icon: '💪' },
    { value: 'advantagesFound', label: 'Advantages Found', icon: '🔍' },
    { value: 'totalInsightPoints', label: 'Insight Points', icon: '🧠' },
    { value: 'daysPlayed', label: 'Days Played', icon: '📅' },
  ];

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-2">🏆 Global Leaderboard</h2>
        <p className="text-yellow-100">
          {totalPlayers} players competing across all seasons
        </p>
      </div>

      {/* User Position (if logged in) */}
      {userPosition && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Your Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white/10 rounded p-3">
              <div className="text-2xl font-bold">#{userPosition.rank}</div>
              <div className="text-sm text-blue-100">Global Rank</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-2xl font-bold">{userPosition.tier}</div>
              <div className="text-sm text-blue-100">Tier</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-2xl font-bold">{userPosition.stats.wins}</div>
              <div className="text-sm text-blue-100">Wins</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-2xl font-bold">
                {Math.round(userPosition.stats.derived.winRate)}%
              </div>
              <div className="text-sm text-blue-100">Win Rate</div>
            </div>
          </div>

          {/* Percentiles */}
          <div className="space-y-2">
            <div className="text-sm font-semibold mb-1">Percentile Rankings</div>
            <div className="bg-white/10 rounded p-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Wins</span>
                <span>{userPosition.percentiles.wins}th percentile</span>
              </div>
              <div className="bg-white/20 rounded h-2">
                <div
                  className="bg-yellow-400 h-2 rounded"
                  style={{ width: `${userPosition.percentiles.wins}%` }}
                />
              </div>
            </div>
            <div className="bg-white/10 rounded p-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Challenges</span>
                <span>{userPosition.percentiles.challenges}th percentile</span>
              </div>
              <div className="bg-white/20 rounded h-2">
                <div
                  className="bg-yellow-400 h-2 rounded"
                  style={{ width: `${userPosition.percentiles.challenges}%` }}
                />
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">Achievements</div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {userPosition.achievements
                .filter((a) => a.earned)
                .map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-white/10 rounded p-2 text-center"
                    title={achievement.description}
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="text-xs mt-1">{achievement.name}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Stat Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h3 className="font-semibold mb-3">Sort By:</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {stats.map((stat) => (
            <button
              key={stat.value}
              onClick={() => setSelectedStat(stat.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStat === stat.value
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {stat.icon} {stat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Player</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Tier</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Games</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Wins</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Win %</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Challenges</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  {stats.find((s) => s.value === selectedStat)?.label}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No players yet
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={`${
                      entry.userId === userId
                        ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-lg">{getRankMedal(entry.rank)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{entry.userName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${entry.tierColor} font-semibold`}>
                        {entry.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{entry.stats.gamesPlayed}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {entry.stats.wins}
                    </td>
                    <td className="px-4 py-3 text-right">{entry.stats.winRate}%</td>
                    <td className="px-4 py-3 text-right">{entry.stats.challengesWon}</td>
                    <td className="px-4 py-3 text-right font-bold text-yellow-600">
                      {typeof entry.value === 'number' && entry.value % 1 !== 0
                        ? entry.value.toFixed(1)
                        : entry.value}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
