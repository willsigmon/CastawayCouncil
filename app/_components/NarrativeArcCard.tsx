"use client";

import { useState, useEffect } from "react";

interface NarrativeArcCardProps {
  seasonId: string;
  playerId: string;
}

type Arc = {
  id: string;
  arcType: string;
  title: string;
  description?: string;
  progress: number;
  milestonesJson?: Array<{ day: number; event: string; progress: number }>;
  isActive: boolean;
};

const arcTypeColors: Record<string, string> = {
  redemption: "bg-green-900/20 border-green-700",
  villain: "bg-red-900/20 border-red-700",
  underdog: "bg-blue-900/20 border-blue-700",
  leader: "bg-yellow-900/20 border-yellow-700",
  social: "bg-purple-900/20 border-purple-700",
  custom: "bg-stone-900/20 border-stone-700",
};

const arcTypeIcons: Record<string, string> = {
  redemption: "✨",
  villain: "😈",
  underdog: "🏃",
  leader: "👑",
  social: "🤝",
  custom: "📖",
};

export function NarrativeArcCard({ seasonId, playerId }: NarrativeArcCardProps) {
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/narrative/arcs?seasonId=${seasonId}&playerId=${playerId}&isActive=true`)
      .then((res) => res.json())
      .then((data) => setArcs(data.arcs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [seasonId, playerId]);

  if (loading) {
    return <div className="text-stone-400">Loading arcs...</div>;
  }

  if (arcs.length === 0) {
    return (
      <div className="p-4 bg-stone-800/50 rounded-lg border border-stone-700 text-center text-stone-400">
        No active narrative arcs
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {arcs.map((arc) => {
        const milestones = arc.milestonesJson || [];
        const milestonePositions = [25, 50, 75, 100];

        return (
          <div
            key={arc.id}
            className={`p-4 rounded-lg border ${arcTypeColors[arc.arcType] || arcTypeColors.custom}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{arcTypeIcons[arc.arcType] || "📖"}</span>
              <div className="flex-1">
                <h3 className="font-bold text-stone-200">{arc.title}</h3>
                <div className="text-xs text-stone-400 capitalize">{arc.arcType}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-400">{arc.progress}%</div>
                <div className="text-xs text-stone-400">Progress</div>
              </div>
            </div>

            {arc.description && (
              <p className="text-sm text-stone-300 mb-3">{arc.description}</p>
            )}

            {/* Progress Bar with Milestones */}
            <div className="relative mb-4">
              <div className="w-full bg-stone-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-amber-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${arc.progress}%` }}
                />
              </div>
              {/* Milestone Markers */}
              <div className="absolute top-0 left-0 right-0 h-4 flex justify-between items-center px-1">
                {milestonePositions.map((pos) => (
                  <div
                    key={pos}
                    className={`w-2 h-2 rounded-full ${
                      arc.progress >= pos ? "bg-amber-300" : "bg-stone-600"
                    }`}
                    style={{ marginLeft: pos === 25 ? "0" : pos === 50 ? "25%" : pos === 75 ? "50%" : "75%" }}
                  />
                ))}
              </div>
            </div>

            {/* Milestones Timeline */}
            {milestones.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-stone-300 mb-2">Milestones:</div>
                {milestones.map((milestone, idx) => (
                  <div key={idx} className="text-xs text-stone-400 pl-4 border-l-2 border-stone-700">
                    <div className="font-semibold text-stone-300">Day {milestone.day}</div>
                    <div>{milestone.event}</div>
                    <div className="text-stone-500">{milestone.progress}% complete</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

