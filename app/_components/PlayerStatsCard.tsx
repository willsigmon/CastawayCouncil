"use client";

import { createClient } from "@/app/_lib/supabase/client";
import { useEffect, useState } from "react";

type PlayerStats = {
  challengeWins: number;
  tribalsSurvived: number;
  votesReceived: number;
  advantagesFound: number;
  allianceCount: number;
  confessionalCount: number;
};

export function PlayerStatsCard({ playerId, seasonId }: { playerId: string; seasonId: string }) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/stats/player?playerId=${playerId}&seasonId=${seasonId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to load player stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
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
    <div className="grid grid-cols-3 gap-2 p-4 bg-gradient-to-br from-amber-900/20 to-stone-900/40 rounded-lg border border-amber-700/30 hover:border-amber-600/50 transition-all duration-300">
      <StatBadge label="Wins" value={stats.challengeWins} icon="🏆" />
      <StatBadge label="Survived" value={stats.tribalsSurvived} icon="🔥" />
      <StatBadge label="Votes" value={stats.votesReceived} icon="📜" />
      <StatBadge label="Advantages" value={stats.advantagesFound} icon="💎" />
      <StatBadge label="Alliances" value={stats.allianceCount} icon="🤝" />
      <StatBadge label="Confessionals" value={stats.confessionalCount} icon="🎥" />
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
