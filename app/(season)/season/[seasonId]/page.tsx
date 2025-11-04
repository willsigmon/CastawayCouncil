import { db } from '@/drizzle/db';
import { seasons, players, stats, tribeMembers, tribes, events } from '@/drizzle/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { StatBar } from '@/app/_components/stat-bar';
import { PhaseIndicator } from '@/app/_components/phase-indicator';
import { TaskActions } from './task-actions';

interface PageProps {
  params: { seasonId: string };
}

export default async function SeasonDashboard({ params }: PageProps) {
  const { seasonId } = params;

  // Get season data
  const season = await db.query.seasons.findFirst({
    where: eq(seasons.id, seasonId),
  });

  if (!season) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Season not found</h1>
      </div>
    );
  }

  // In real app, get from auth
  const mockPlayerId = (await db.query.players.findFirst({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
  }))?.id;

  if (!mockPlayerId) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">No active players</h1>
      </div>
    );
  }

  // Get player data
  const player = await db.query.players.findFirst({
    where: eq(players.id, mockPlayerId),
    with: {
      user: true,
      tribeMembers: {
        with: {
          tribe: true,
        },
      },
    },
  });

  // Get current stats
  const currentStats = await db.query.stats.findFirst({
    where: and(eq(stats.playerId, mockPlayerId), eq(stats.day, season.dayIndex)),
  });

  // Get tribe
  const tribeData = player?.tribeMembers[0]?.tribe;

  // Get latest phase event
  const latestEvent = await db.query.events.findFirst({
    where: and(eq(events.seasonId, seasonId), eq(events.day, season.dayIndex)),
    orderBy: [desc(events.createdAt)],
  });

  // Mock phase for now
  const currentPhase = 'camp' as const;
  const phaseEndsAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
      {/* Phase Indicator */}
      <PhaseIndicator currentPhase={currentPhase} phaseEndsAt={phaseEndsAt} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Player Info & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Player Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{player?.displayName}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  @{player?.user.handle}
                </p>
                {tribeData && (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tribeData.color }}
                    />
                    <span className="font-semibold">{tribeData.name}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Day</p>
                <p className="text-3xl font-bold">{season.dayIndex}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
            <h3 className="text-xl font-bold mb-4">Your Stats</h3>
            {currentStats ? (
              <>
                <StatBar
                  label="Energy"
                  value={currentStats.energy}
                  max={100}
                  color="energy"
                />
                <StatBar
                  label="Hunger"
                  value={currentStats.hunger}
                  max={100}
                  color="hunger"
                />
                <StatBar
                  label="Thirst"
                  value={currentStats.thirst}
                  max={100}
                  color="thirst"
                />
                <StatBar
                  label="Social"
                  value={currentStats.social}
                  max={100}
                  color="social"
                />
              </>
            ) : (
              <p className="text-gray-500">No stats available for today</p>
            )}
          </div>

          {/* Task Actions */}
          <TaskActions playerId={mockPlayerId} currentPhase={currentPhase} />
        </div>

        {/* Right Column: Tribe Info & Recent Events */}
        <div className="space-y-6">
          {/* Tribe Roster */}
          {tribeData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">
                {tribeData.name} Tribe
              </h3>
              <TribeRoster tribeId={tribeData.id} seasonId={seasonId} />
            </div>
          )}

          {/* Quick Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
              💡 Phase Tips
            </h3>
            {currentPhase === 'camp' && (
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Forage for food to restore hunger</li>
                <li>Gather water (watch for tainted water!)</li>
                <li>Rest to restore energy</li>
                <li>Help allies to build social bonds</li>
              </ul>
            )}
            {currentPhase === 'challenge' && (
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Commit your seed before the deadline</li>
                <li>Higher energy = better rolls</li>
                <li>Team scores use top player rolls</li>
                <li>Winning tribe gets immunity</li>
              </ul>
            )}
            {currentPhase === 'vote' && (
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Vote for who you want eliminated</li>
                <li>You can change your vote until deadline</li>
                <li>Immunity idols negate votes</li>
                <li>Losing tribe votes someone out</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

async function TribeRoster({ tribeId, seasonId }: { tribeId: string; seasonId: string }) {
  const members = await db.query.tribeMembers.findMany({
    where: eq(tribeMembers.tribeId, tribeId),
    with: {
      player: {
        with: {
          user: true,
        },
      },
    },
  });

  const activemembers = members.filter((m) => !m.player.eliminatedAt);

  return (
    <div className="space-y-2">
      {activemembers.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div>
            <p className="font-medium">{member.player.displayName}</p>
            <p className="text-xs text-gray-500">@{member.player.user.handle}</p>
          </div>
          <div className="w-3 h-3 rounded-full bg-green-500" title="Active" />
        </div>
      ))}
      {activemembers.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No tribe members</p>
      )}
    </div>
  );
}
