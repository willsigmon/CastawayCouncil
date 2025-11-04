import { db } from '@/drizzle/db';
import { events } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';

interface PageProps {
  params: { seasonId: string };
}

export default async function EventLogPage({ params }: PageProps) {
  const { seasonId } = params;

  // Get all events for this season
  const seasonEvents = await db.query.events.findMany({
    where: eq(events.seasonId, seasonId),
    orderBy: [desc(events.createdAt)],
    limit: 100,
  });

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">📜 Public Event Log</h1>
        <p className="text-gray-300">
          A chronological record of all major events this season
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {seasonEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No events yet. The season is just beginning!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {seasonEvents.map((event) => {
              const payload = event.payloadJson as any;
              let icon = '📌';
              let title = event.kind;
              let description = '';

              switch (event.kind) {
                case 'phase_open':
                  icon = payload?.phase === 'camp' ? '🏕️' : payload?.phase === 'challenge' ? '⚔️' : '🔥';
                  title = `${payload?.phase || 'Phase'} Phase Started`;
                  description = `Day ${event.day}`;
                  break;
                case 'phase_close':
                  icon = '⏱️';
                  title = `${payload?.phase || 'Phase'} Phase Ended`;
                  description = `Day ${event.day}`;
                  break;
                case 'eliminate':
                  icon = '💀';
                  title = 'Player Eliminated';
                  description = `Day ${event.day} - ${payload?.eliminatedPlayerId?.slice(0, 8)}...`;
                  break;
                case 'merge':
                  icon = '🎉';
                  title = 'TRIBES MERGED!';
                  description = `${payload?.remainingPlayers || 0} players remain`;
                  break;
                case 'idol_found':
                  icon = '🗿';
                  title = 'Hidden Immunity Idol Found';
                  description = `Day ${event.day}`;
                  break;
                case 'storm':
                  icon = '⛈️';
                  title = 'Storm Event';
                  description = `Day ${event.day} - Resources impacted`;
                  break;
                case 'swap':
                  icon = '🔄';
                  title = 'Tribe Swap';
                  description = `Day ${event.day}`;
                  break;
              }

              return (
                <div
                  key={event.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{title}</h3>
                          {description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {description}
                            </p>
                          )}
                        </div>
                        <time className="text-xs text-gray-500 whitespace-nowrap ml-4">
                          {new Date(event.createdAt).toLocaleString()}
                        </time>
                      </div>
                      {payload && Object.keys(payload).length > 2 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                            {JSON.stringify(payload, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
