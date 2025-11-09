"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GMAnalyticsCard } from "@/app/_components/GMAnalyticsCard";

type Analytics = {
  events: {
    byType: Array<{ type: string; count: number; triggered: number }>;
    perDay: Array<{ day: string; count: number }>;
    total: number;
    triggered: number;
  };
  projects: {
    byStatus: Array<{ status: string; count: number; tribeProjects: number; playerProjects: number }>;
    total: number;
    tribeCount: number;
    playerCount: number;
  };
  resources: {
    distribution: Array<{ type: string; totalQuantity: number; uniqueOwners: number }>;
    transactions: Array<{ reason: string; totalDelta: number; count: number }>;
  };
  engagement: {
    activePlayers: Array<{ playerId: string; displayName: string; actionCount: number; lastAction: string }>;
    totalPlayers: number;
  };
  narrativeArcs: {
    byType: Array<{ arcType: string; avgProgress: number; count: number; active: number }>;
    total: number;
  };
};

export default function GMAnalyticsPage() {
  const params = useParams();
  const seasonId = params.seasonId as string;
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/gm/analytics?seasonId=${seasonId}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [seasonId]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-8 bg-stone-800 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-stone-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="p-8 text-stone-400">Failed to load analytics</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-100 mb-6">GM Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Event Statistics */}
        <GMAnalyticsCard title="Campaign Events" icon="📊">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Total Events</span>
              <span className="text-2xl font-bold text-purple-400">{analytics.events.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Triggered</span>
              <span className="text-xl font-semibold text-green-400">{analytics.events.triggered}</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm font-semibold text-stone-300 mb-2">By Type:</div>
              {analytics.events.byType.map((stat) => (
                <div key={stat.type} className="flex justify-between text-sm">
                  <span className="text-stone-400 capitalize">{stat.type.replace(/_/g, " ")}</span>
                  <span className="text-stone-200">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </GMAnalyticsCard>

        {/* Project Statistics */}
        <GMAnalyticsCard title="Projects" icon="🔨">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Total Projects</span>
              <span className="text-2xl font-bold text-blue-400">{analytics.projects.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Tribe Projects</span>
              <span className="text-xl font-semibold text-blue-300">{analytics.projects.tribeCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Player Projects</span>
              <span className="text-xl font-semibold text-blue-300">{analytics.projects.playerCount}</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm font-semibold text-stone-300 mb-2">By Status:</div>
              {analytics.projects.byStatus.map((stat) => (
                <div key={stat.status} className="flex justify-between text-sm">
                  <span className="text-stone-400 capitalize">{stat.status}</span>
                  <span className="text-stone-200">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </GMAnalyticsCard>

        {/* Resource Economy */}
        <GMAnalyticsCard title="Resource Economy" icon="💎">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-stone-300 mb-2">Distribution:</div>
            {analytics.resources.distribution.map((dist) => (
              <div key={dist.type} className="flex justify-between text-sm">
                <span className="text-stone-400 capitalize">{dist.type}</span>
                <div className="flex gap-4">
                  <span className="text-stone-300">Qty: {dist.totalQuantity}</span>
                  <span className="text-stone-400">Owners: {dist.uniqueOwners}</span>
                </div>
              </div>
            ))}
            {analytics.resources.distribution.length === 0 && (
              <div className="text-sm text-stone-500">No resources yet</div>
            )}
          </div>
        </GMAnalyticsCard>

        {/* Player Engagement */}
        <GMAnalyticsCard title="Player Engagement" icon="👥">
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-stone-400">Active Players</span>
              <span className="text-xl font-bold text-green-400">{analytics.engagement.totalPlayers}</span>
            </div>
            <div className="text-sm font-semibold text-stone-300 mb-2">Top Players:</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.engagement.activePlayers.slice(0, 10).map((player) => (
                <div key={player.playerId} className="flex justify-between text-sm">
                  <span className="text-stone-300 truncate">{player.displayName}</span>
                  <span className="text-stone-400">{player.actionCount} actions</span>
                </div>
              ))}
            </div>
          </div>
        </GMAnalyticsCard>

        {/* Narrative Arcs */}
        <GMAnalyticsCard title="Narrative Arcs" icon="📖">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Total Arcs</span>
              <span className="text-2xl font-bold text-purple-400">{analytics.narrativeArcs.total}</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm font-semibold text-stone-300 mb-2">By Type:</div>
              {analytics.narrativeArcs.byType.map((arc) => (
                <div key={arc.arcType} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400 capitalize">{arc.arcType}</span>
                    <span className="text-stone-200">{arc.count}</span>
                  </div>
                  <div className="w-full bg-stone-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${arc.avgProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-stone-500">Avg Progress: {arc.avgProgress.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        </GMAnalyticsCard>

        {/* Transaction Activity */}
        <GMAnalyticsCard title="Resource Transactions" icon="📈">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-stone-300 mb-2">Top Reasons:</div>
            {analytics.resources.transactions.map((txn) => (
              <div key={txn.reason} className="flex justify-between text-sm">
                <span className="text-stone-400 capitalize">{txn.reason.replace(/_/g, " ")}</span>
                <div className="flex gap-4">
                  <span className="text-stone-300">{txn.count} txns</span>
                  <span className={`${txn.totalDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {txn.totalDelta >= 0 ? "+" : ""}
                    {txn.totalDelta}
                  </span>
                </div>
              </div>
            ))}
            {analytics.resources.transactions.length === 0 && (
              <div className="text-sm text-stone-500">No transactions yet</div>
            )}
          </div>
        </GMAnalyticsCard>
      </div>
    </div>
  );
}

