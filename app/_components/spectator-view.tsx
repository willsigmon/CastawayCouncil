'use client';

import { useState, useEffect } from 'react';

interface SpectatorViewProps {
  seasonId: string;
  playerId: string;
  playerRole: 'spectator' | 'jury';
  eliminatedDay: number;
}

interface TribeChat {
  id: string;
  tribeName: string;
  tribeColor: string;
  messages: Array<{
    id: string;
    fromPlayer: string | null;
    body: string;
    isSystemMessage: boolean;
    createdAt: string;
  }>;
}

interface GameState {
  currentDay: number;
  currentPhase: 'camp' | 'challenge' | 'vote';
  activePlayers: number;
  merged: boolean;
  recentEvents: Array<{
    day: number;
    kind: string;
    description: string;
    createdAt: string;
  }>;
}

export function SpectatorView({
  seasonId,
  playerId,
  playerRole,
  eliminatedDay,
}: SpectatorViewProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [tribeChats, setTribeChats] = useState<TribeChat[]>([]);
  const [selectedTribe, setSelectedTribe] = useState<string | null>(null);
  const [showConfessionals, setShowConfessionals] = useState(false);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [seasonId]);

  async function fetchGameState() {
    try {
      // Fetch current game state
      const stateResponse = await fetch(`/api/seasons/${seasonId}/state`);
      if (stateResponse.ok) {
        const data = await stateResponse.json();
        setGameState(data);
      }

      // Fetch tribe chats (spectators can see all chats)
      const chatResponse = await fetch(`/api/seasons/${seasonId}/spectator-chats`);
      if (chatResponse.ok) {
        const data = await chatResponse.json();
        setTribeChats(data.tribes);
      }
    } catch (error) {
      console.error('Failed to fetch spectator data:', error);
    }
  }

  if (!gameState) {
    return <div className="text-gray-500">Loading game state...</div>;
  }

  const isJuryMember = playerRole === 'jury';

  return (
    <div className="space-y-6">
      {/* Spectator Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {isJuryMember ? '⚖️ Jury Member' : '👁️ Spectator Mode'}
            </h2>
            <p className="text-gray-300">
              {isJuryMember
                ? 'You are on the jury. Watch the remaining players and prepare your vote.'
                : 'You were eliminated on Day ' + eliminatedDay + '. You can watch but cannot interact.'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">Day {gameState.currentDay}</div>
            <div className="text-sm text-gray-300 capitalize">{gameState.currentPhase} Phase</div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded p-3">
            <div className="text-xl font-bold">{gameState.activePlayers}</div>
            <div className="text-sm text-gray-300">Players Remaining</div>
          </div>
          <div className="bg-white/10 rounded p-3">
            <div className="text-xl font-bold">
              {gameState.merged ? 'Individual' : 'Tribes'}
            </div>
            <div className="text-sm text-gray-300">Competition Type</div>
          </div>
          <div className="bg-white/10 rounded p-3">
            <div className="text-xl font-bold">{gameState.recentEvents.length}</div>
            <div className="text-sm text-gray-300">Recent Events</div>
          </div>
        </div>
      </div>

      {/* Info Box for Spectators */}
      <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <div className="font-semibold mb-1">Spectator Privileges</div>
            <ul className="text-sm space-y-1">
              <li>✅ Watch all tribe chats and conversations</li>
              <li>✅ See challenge results and voting outcomes</li>
              <li>✅ View player stats and game events</li>
              <li>❌ Cannot send messages or influence the game</li>
              {isJuryMember && <li>⚖️ You will vote for the winner at the finale</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      {gameState.recentEvents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold mb-4">📰 Recent Events</h3>
          <div className="space-y-3">
            {gameState.recentEvents.slice(0, 5).map((event, i) => (
              <div
                key={i}
                className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 dark:bg-purple-900/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    Day {event.day} - {event.kind}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {event.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tribe Chats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-xl font-bold mb-4">💬 Tribe Communications</h3>

        {/* Tribe Selector */}
        <div className="flex gap-2 mb-4">
          {tribeChats.map((tribe) => (
            <button
              key={tribe.id}
              onClick={() => setSelectedTribe(tribe.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTribe === tribe.id
                  ? 'text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              style={
                selectedTribe === tribe.id
                  ? { backgroundColor: tribe.tribeColor }
                  : undefined
              }
            >
              {tribe.tribeName}
            </button>
          ))}
        </div>

        {/* Selected Tribe Chat */}
        {selectedTribe && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
            {tribeChats
              .find((t) => t.id === selectedTribe)
              ?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 ${
                    msg.isSystemMessage ? 'text-center italic text-gray-500' : ''
                  }`}
                >
                  {msg.isSystemMessage ? (
                    <div className="text-sm">{msg.body}</div>
                  ) : (
                    <div>
                      <div className="font-semibold text-sm mb-1">
                        {msg.fromPlayer || 'System'}
                        <span className="ml-2 text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">{msg.body}</div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {!selectedTribe && (
          <div className="text-center text-gray-500 py-8">
            Select a tribe to view their chat
          </div>
        )}
      </div>

      {/* Jury Member Special Features */}
      {isJuryMember && (
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-yellow-300">
          <h3 className="text-xl font-bold mb-2 text-yellow-800 dark:text-yellow-200">
            ⚖️ Jury Responsibilities
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            As a jury member, you will vote for the winner at the finale. Pay attention to:
          </p>
          <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
            <li>• Strategic gameplay and big moves</li>
            <li>• Social relationships and alliances</li>
            <li>• Challenge performance</li>
            <li>• How players treat each other</li>
            <li>• Final tribal council speeches</li>
          </ul>
          <div className="mt-4 bg-white dark:bg-gray-800 rounded p-3">
            <div className="text-sm font-semibold mb-1">Voting opens at finale</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              You'll vote for one of the final three players to win the game
            </div>
          </div>
        </div>
      )}

      {/* Postseason Confessionals */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">🎬 Postseason Content</h3>
          <button
            onClick={() => setShowConfessionals(!showConfessionals)}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            {showConfessionals ? 'Hide' : 'Show'} Confessionals
          </button>
        </div>

        {showConfessionals ? (
          <div className="text-gray-600 dark:text-gray-400">
            <p>
              Confessionals will be available here after the season concludes. Check back after
              the finale!
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Click "Show Confessionals" to view player confessionals (available after season ends)
          </p>
        )}
      </div>
    </div>
  );
}
