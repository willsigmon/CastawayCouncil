"use client";

import { useEffect, useState } from "react";

type PlayerStats = {
  challengeWins: number;
  tribalsSurvived: number;
  votesReceived: number;
  advantagesFound: number;
  allianceCount: number;
  confessionalCount: number;
};

type InventoryItem = {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  quantity: number;
};

export function PlayerStatsCard({ playerId, seasonId }: { playerId: string; seasonId: string }) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, inventoryRes] = await Promise.all([
          fetch(`/api/stats/player?playerId=${playerId}&seasonId=${seasonId}`),
          fetch(`/api/inventory?seasonId=${seasonId}&playerId=${playerId}`),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
        }

        if (inventoryRes.ok) {
          const data = await inventoryRes.json();
          setInventory(data.inventory || []);
        }
      } catch (error) {
        console.error("Failed to load player data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [playerId, seasonId]);

  if (loading) {
    return (
      <div className="animate-pulse wood-panel rounded-lg p-4">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-amber-900/20 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 p-4 bg-gradient-to-br from-amber-900/20 to-stone-900/40 rounded-lg border border-amber-700/30 hover:border-amber-600/50 transition-all duration-300">
        <StatBadge label="Wins" value={stats.challengeWins} icon="🏆" />
        <StatBadge label="Survived" value={stats.tribalsSurvived} icon="🔥" />
        <StatBadge label="Votes" value={stats.votesReceived} icon="📜" />
        <StatBadge label="Advantages" value={stats.advantagesFound} icon="💎" />
        <StatBadge label="Alliances" value={stats.allianceCount} icon="🤝" />
        <StatBadge label="Confessionals" value={stats.confessionalCount} icon="🎥" />
      </div>

      {inventory.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-blue-900/20 to-stone-900/40 rounded-lg border border-blue-700/30">
          <h3 className="text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Inventory</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-stone-800/50 rounded border border-stone-700/50"
              >
                <span className="text-lg">
                  {item.resourceType === "food" && "🍎"}
                  {item.resourceType === "water" && "💧"}
                  {item.resourceType === "materials" && "🪵"}
                  {item.resourceType === "tools" && "🔧"}
                  {item.resourceType === "medicine" && "💊"}
                  {item.resourceType === "luxury" && "✨"}
                  {!["food", "water", "materials", "tools", "medicine", "luxury"].includes(item.resourceType) && "📦"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-stone-200 truncate">{item.resourceName}</div>
                  <div className="text-xs text-stone-400">x{item.quantity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="text-center group cursor-default">
      <div className="text-2xl transition-transform duration-200 group-hover:scale-110">{icon}</div>
      <div className="text-xl font-bold text-amber-400">{value}</div>
      <div className="text-xs text-stone-400">{label}</div>
    </div>
  );
}
