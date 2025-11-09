"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AllianceNetwork } from "@/app/_components/AllianceNetwork";
import { PlayerRelationshipCard } from "@/app/_components/PlayerRelationshipCard";

type Relationship = {
  authorId: string;
  authorName: string;
  subjectId: string;
  subjectName: string;
  trustLevel: "distrust" | "neutral" | "ally" | "core";
  noteCount: number;
};

type PlayerTrustCounts = {
  playerId: string;
  playerName: string;
  distrust: number;
  neutral: number;
  ally: number;
  core: number;
};

export default function AlliancesPage() {
  const params = useParams();
  const seasonId = params.seasonId as string;
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [playerTrustCounts, setPlayerTrustCounts] = useState<PlayerTrustCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/alliance/stats?seasonId=${seasonId}`);
        if (res.ok) {
          const data = await res.json();
          setRelationships(data.stats.relationships || []);
          setPlayerTrustCounts(data.stats.playerTrustCounts || []);
        }
      } catch (error) {
        console.error("Failed to load alliance stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [seasonId]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-8 bg-stone-800 rounded w-48 mb-6" />
        <div className="h-96 bg-stone-800 rounded" />
      </div>
    );
  }

  const selectedRelationships = selectedPlayerId
    ? relationships.filter((r) => r.authorId === selectedPlayerId)
    : [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-100 mb-6">Alliance Network</h1>

      {/* Network Visualization */}
      <div className="mb-8">
        <AllianceNetwork seasonId={seasonId} />
      </div>

      {/* Player Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-200 mb-4">View Player Relationships</h2>
        <div className="flex flex-wrap gap-2">
          {playerTrustCounts.map((player) => (
            <button
              key={player.playerId}
              onClick={() => setSelectedPlayerId(selectedPlayerId === player.playerId ? null : player.playerId)}
              className={`px-4 py-2 rounded border transition-colors ${
                selectedPlayerId === player.playerId
                  ? "bg-amber-600 border-amber-500 text-white"
                  : "bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-600"
              }`}
            >
              {player.playerName}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Player Relationships */}
      {selectedPlayerId && selectedRelationships.length > 0 && (
        <div className="mb-6">
          <PlayerRelationshipCard
            playerId={selectedPlayerId}
            playerName={playerTrustCounts.find((p) => p.playerId === selectedPlayerId)?.playerName || "Unknown"}
            seasonId={seasonId}
            relationships={selectedRelationships}
          />
        </div>
      )}

      {/* Trust Distribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {playerTrustCounts.slice(0, 8).map((player) => (
          <div key={player.playerId} className="p-4 bg-stone-800/50 rounded-lg border border-stone-700">
            <h3 className="font-semibold text-stone-200 mb-3">{player.playerName}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Distrust</span>
                <span className="text-red-400">{player.distrust}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Neutral</span>
                <span className="text-yellow-400">{player.neutral}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Ally</span>
                <span className="text-green-400">{player.ally}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Core</span>
                <span className="text-blue-400">{player.core}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

