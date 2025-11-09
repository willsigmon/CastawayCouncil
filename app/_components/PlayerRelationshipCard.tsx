"use client";

import { TrustMeter } from "./TrustMeter";

type TrustLevel = "distrust" | "neutral" | "ally" | "core";

interface Relationship {
  subjectId: string;
  subjectName: string;
  trustLevel: TrustLevel;
  noteCount: number;
}

interface PlayerRelationshipCardProps {
  playerId: string;
  playerName: string;
  seasonId: string;
  relationships: Relationship[];
}

export function PlayerRelationshipCard({
  playerId,
  playerName,
  seasonId,
  relationships,
}: PlayerRelationshipCardProps) {
  const trustCounts = {
    distrust: relationships.filter((r) => r.trustLevel === "distrust").length,
    neutral: relationships.filter((r) => r.trustLevel === "neutral").length,
    ally: relationships.filter((r) => r.trustLevel === "ally").length,
    core: relationships.filter((r) => r.trustLevel === "core").length,
  };

  return (
    <div className="p-4 bg-stone-800/50 rounded-lg border border-stone-700">
      <h3 className="text-lg font-semibold text-stone-200 mb-4">{playerName}'s Relationships</h3>

      {/* Trust Distribution */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-red-900/20 rounded border border-red-700/30">
          <div className="text-2xl font-bold text-red-400">{trustCounts.distrust}</div>
          <div className="text-xs text-stone-400">Distrust</div>
        </div>
        <div className="text-center p-2 bg-yellow-900/20 rounded border border-yellow-700/30">
          <div className="text-2xl font-bold text-yellow-400">{trustCounts.neutral}</div>
          <div className="text-xs text-stone-400">Neutral</div>
        </div>
        <div className="text-center p-2 bg-green-900/20 rounded border border-green-700/30">
          <div className="text-2xl font-bold text-green-400">{trustCounts.ally}</div>
          <div className="text-xs text-stone-400">Ally</div>
        </div>
        <div className="text-center p-2 bg-blue-900/20 rounded border border-blue-700/30">
          <div className="text-2xl font-bold text-blue-400">{trustCounts.core}</div>
          <div className="text-xs text-stone-400">Core</div>
        </div>
      </div>

      {/* Relationship List */}
      <div className="space-y-2">
        {relationships.map((rel) => (
          <div
            key={rel.subjectId}
            className="flex items-center justify-between p-2 bg-stone-700/30 rounded border border-stone-600/30"
          >
            <div className="flex-1">
              <div className="font-semibold text-stone-200">{rel.subjectName}</div>
              <div className="text-xs text-stone-400">{rel.noteCount} notes</div>
            </div>
            <div className="w-32">
              <TrustMeter trustLevel={rel.trustLevel} size="sm" showLabel={false} />
            </div>
          </div>
        ))}
        {relationships.length === 0 && (
          <div className="text-center py-4 text-stone-500 text-sm">No relationships tracked yet</div>
        )}
      </div>
    </div>
  );
}

