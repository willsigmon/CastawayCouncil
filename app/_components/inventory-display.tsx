'use client';

import { useEffect, useState } from 'react';

interface InventoryItem {
  id: string;
  itemType: string;
  itemName: string;
  quantity: number;
  inventoryType: 'personal' | 'tribe';
}

interface Advantage {
  id: string;
  advantageType: 'immunity' | 'vote_steal' | 'extra_vote';
  foundByPlayerId: string | null;
  playedAt: Date | null;
}

interface PersonalInventoryProps {
  playerId: string;
  onPlayAdvantage?: (advantageId: string) => void;
}

interface TribeInventoryProps {
  tribeId: string;
}

const advantageInfo = {
  immunity: {
    name: 'Immunity Advantage',
    icon: '🛡️',
    description: 'Negates all votes against you at tribal council',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300',
  },
  vote_steal: {
    name: 'Vote Steal',
    icon: '🎯',
    description: 'Steal someone\'s vote and use it yourself',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300',
  },
  extra_vote: {
    name: 'Extra Vote',
    icon: '➕',
    description: 'Cast two votes instead of one',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300',
  },
};

const itemIcons: Record<string, string> = {
  firewood: '🪵',
  coconut: '🥥',
  fish: '🐟',
  spear: '🔱',
  cooked_fish: '🍖',
  cooked_coconut: '🥘',
  water: '💧',
};

export function PersonalInventory({ playerId, onPlayAdvantage }: PersonalInventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [advantages, setAdvantages] = useState<Advantage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(`/api/inventory?playerId=${playerId}`);
        if (response.ok) {
          const data = await response.json();
          setInventory(data.items || []);
          setAdvantages(data.advantages || []);
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [playerId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">🎒 Personal Inventory</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const hasAdvantages = advantages.length > 0;
  const hasItems = inventory.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">🎒 Personal Inventory</h3>

      {/* Advantages Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">🏆 Advantages</h4>
        {hasAdvantages ? (
          <div className="space-y-2">
            {advantages.map((advantage) => {
              const info = advantageInfo[advantage.advantageType];
              return (
                <div
                  key={advantage.id}
                  className={`${info.color} border-2 rounded-lg p-4`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{info.icon}</span>
                        <span className="font-bold">{info.name}</span>
                      </div>
                      <p className="text-sm opacity-80">{info.description}</p>
                    </div>
                    {onPlayAdvantage && (
                      <button
                        onClick={() => onPlayAdvantage(advantage.id)}
                        className="ml-4 px-4 py-2 bg-white/50 hover:bg-white/70 rounded font-semibold text-sm transition-colors"
                      >
                        Play
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No advantages found yet. Search for them at camp!
            </p>
          </div>
        )}
      </div>

      {/* Personal Items Section */}
      <div>
        <h4 className="text-lg font-semibold mb-3">📦 Items</h4>
        {hasItems ? (
          <div className="grid grid-cols-2 gap-2">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{itemIcons[item.itemType] || '📦'}</span>
                  <span className="font-medium text-sm">{item.itemName}</span>
                </div>
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  ×{item.quantity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No personal items
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TribeInventory({ tribeId }: TribeInventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(`/api/inventory?tribeId=${tribeId}`);
        if (response.ok) {
          const data = await response.json();
          setInventory(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch tribe inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [tribeId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">🏝️ Tribe Resources</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const hasItems = inventory.length > 0;

  // Group by category
  const resources = inventory.filter(i => ['firewood', 'coconut', 'fish', 'water'].includes(i.itemType));
  const tools = inventory.filter(i => ['spear'].includes(i.itemType));
  const prepared = inventory.filter(i => ['cooked_fish', 'cooked_coconut'].includes(i.itemType));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">🏝️ Tribe Resources</h3>

      {hasItems ? (
        <div className="space-y-4">
          {/* Raw Resources */}
          {resources.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
                Raw Resources
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {resources.map((item) => (
                  <div
                    key={item.id}
                    className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-center justify-between border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{itemIcons[item.itemType] || '📦'}</span>
                      <span className="font-medium text-sm">{item.itemName}</span>
                    </div>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {tools.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
                Tools
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {tools.map((item) => (
                  <div
                    key={item.id}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center justify-between border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{itemIcons[item.itemType] || '🔧'}</span>
                      <span className="font-medium text-sm">{item.itemName}</span>
                    </div>
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prepared Food */}
          {prepared.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
                Prepared Food
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {prepared.map((item) => (
                  <div
                    key={item.id}
                    className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 flex items-center justify-between border border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{itemIcons[item.itemType] || '🍲'}</span>
                      <span className="font-medium text-sm">{item.itemName}</span>
                    </div>
                    <span className="text-lg font-bold text-orange-700 dark:text-orange-300">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Your tribe has no resources yet. Gather resources at camp!
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Tribe resources are shared by all tribe members. Gather resources and cook food to help everyone survive!
        </p>
      </div>
    </div>
  );
}
