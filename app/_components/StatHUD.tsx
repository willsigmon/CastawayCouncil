"use client";

import { useEffect, useState } from "react";

interface StatHUDProps {
  energy: number;
  hunger: number;
  thirst: number;
  social: number;
  seasonId?: string;
  playerId?: string;
}

type Project = {
  id: string;
  name: string;
  progress: number;
  targetProgress: number;
};

export function StatHUD({ energy, hunger, thirst, social, seasonId, playerId }: StatHUDProps) {
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (seasonId && playerId) {
      fetch(`/api/projects?seasonId=${seasonId}&playerId=${playerId}&status=active`)
        .then((res) => res.json())
        .then((data) => setActiveProjects(data.projects || []))
        .catch(console.error);
    }
  }, [seasonId, playerId]);

  const getColor = (value: number) => {
    if (value >= 70) return "bg-green-500";
    if (value >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 p-4">
      <div className="flex gap-4 justify-around md:justify-center items-center">
        <StatBar label="Energy" value={energy} color={getColor(energy)} />
        <StatBar label="Hunger" value={hunger} color={getColor(hunger)} />
        <StatBar label="Thirst" value={thirst} color={getColor(thirst)} />
        <StatBar label="Social" value={social} color={getColor(social)} />
        {activeProjects.length > 0 && (
          <div className="hidden md:flex gap-2 items-center border-l border-stone-700 pl-4">
            <span className="text-xs text-stone-400">Projects:</span>
            {activeProjects.slice(0, 2).map((project) => (
              <div key={project.id} className="flex items-center gap-1" title={project.name}>
                <span className="text-xs">🔨</span>
                <div className="w-12 h-1.5 bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(project.progress / project.targetProgress) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {activeProjects.length > 2 && (
              <span className="text-xs text-stone-500">+{activeProjects.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center min-w-[60px]">
      <span className="text-xs mb-1">{label}</span>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${value}%`}
        />
      </div>
      <span className="text-xs mt-1">{value}</span>
    </div>
  );
}
