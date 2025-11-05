import { db } from '@/drizzle/db';
import { players, tribeMembers } from '@/drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { PersonalInventory, TribeInventory } from '@/app/_components/inventory-display';

interface PageProps {
  params: { seasonId: string };
}

export default async function InventoryPage({ params }: PageProps) {
  const { seasonId } = params;

  // In real app, get from auth
  const player = await db.query.players.findFirst({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
    with: {
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
            You must be an active player to view inventory
          </p>
        </div>
      </div>
    );
  }

  const tribeData = player.tribeMembers[0]?.tribe;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8">
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">🎒 Inventory</h1>
        <p className="text-amber-100">
          Manage your personal items and view tribe resources
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personal Inventory */}
        <div>
          <PersonalInventory playerId={player.id} />
        </div>

        {/* Tribe Inventory */}
        <div>
          {tribeData ? (
            <TribeInventory tribeId={tribeData.id} />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">🏝️ Tribe Resources</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No tribe assigned
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">
          💡 Inventory Guide
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <h4 className="font-semibold mb-2">Personal Inventory:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Holds advantages you find</li>
              <li>Play advantages at tribal council</li>
              <li>3 advantage types: Immunity, Vote Steal, Extra Vote</li>
              <li>Advantages respawn after use (2 per camp)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Tribe Resources:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Shared by all tribe members</li>
              <li>Gather firewood, coconuts, fish, water</li>
              <li>Tools like spears help with gathering</li>
              <li>Cook food to create prepared meals</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
