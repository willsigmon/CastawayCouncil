import { db } from '@/drizzle/db';
import { players, messages, tribeMembers, tribes } from '@/drizzle/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { ActionLog } from '@/app/_components/action-log';

interface PageProps {
  params: { seasonId: string };
}

export default async function ActionsPage({ params }: PageProps) {
  const { seasonId } = params;

  // In real app, get from auth
  const player = await db.query.players.findFirst({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
    with: {
      user: true,
      tribeMembers: {
        with: {
          tribe: true,
        },
      },
    },
  });

  if (!player) {
    return (
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Player not found</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You must be an active player to view actions
          </p>
        </div>
      </div>
    );
  }

  const tribeData = player.tribeMembers[0]?.tribe;

  if (!tribeData) {
    return (
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">No tribe assigned</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be in a tribe to view action logs
          </p>
        </div>
      </div>
    );
  }

  // Get action messages for this tribe
  // Action messages have channelType='action' and are associated with the tribe
  const actionMessages = await db.query.messages.findMany({
    where: and(
      eq(messages.channelType, 'action'),
      eq(messages.seasonId, seasonId)
      // In production, filter by tribeId through a join
    ),
    orderBy: [desc(messages.createdAt)],
    limit: 100,
    with: {
      fromPlayer: {
        with: {
          user: true,
        },
      },
    },
  });

  // Format messages for the component
  const formattedMessages = actionMessages.map((msg) => ({
    id: msg.id,
    fromPlayerId: msg.fromPlayerId,
    fromPlayerName: msg.fromPlayer?.displayName || 'Unknown',
    playerClass: msg.fromPlayer?.playerClass || undefined,
    wildcardAbility: msg.fromPlayer?.wildcardAbility || undefined,
    body: msg.body,
    metadata: msg.metadata as any,
    createdAt: msg.createdAt,
  }));

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-8 h-screen flex flex-col">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">📋 Action Log</h1>
        <p className="text-green-100">
          View all camp activities from your tribe
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ActionLog
          tribeId={tribeData.id}
          tribeName={tribeData.name}
          initialMessages={formattedMessages}
        />
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
            📊 Camp Actions
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Collect firewood, coconuts, water</li>
            <li>Spear fish (requires spear)</li>
            <li>Build shelter, cook food</li>
            <li>Rest and meditate</li>
            <li>Search for advantages</li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h3 className="font-bold text-green-900 dark:text-green-300 mb-2">
            💡 Strategy Tips
          </h3>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
            <li>Coordinate with tribe on gathering</li>
            <li>Share resources in tribe inventory</li>
            <li>Watch for advantage discoveries</li>
            <li>Monitor everyone's activity patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
