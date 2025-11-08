"use client";

import React from "react";

interface StatHUDProps {
  energy: number;
  hunger: number;
  thirst: number;
  social: number;
}

export function StatHUD({ energy, hunger, thirst, social }: StatHUDProps) {
  const getColor = (value: number) => {
    if (value >= 70) return "bg-green-500";
    if (value >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 p-4 flex gap-4 justify-around md:justify-center">
      <StatBar label="Energy" value={energy} color={getColor(energy)} />
      <StatBar label="Hunger" value={hunger} color={getColor(hunger)} />
      <StatBar label="Thirst" value={thirst} color={getColor(thirst)} />
      <StatBar label="Social" value={social} color={getColor(social)} />
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
