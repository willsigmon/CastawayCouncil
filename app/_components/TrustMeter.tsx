"use client";

type TrustLevel = "distrust" | "neutral" | "ally" | "core";

interface TrustMeterProps {
  trustLevel: TrustLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const trustColors: Record<TrustLevel, string> = {
  distrust: "bg-red-500",
  neutral: "bg-yellow-500",
  ally: "bg-green-500",
  core: "bg-blue-500",
};

const trustLabels: Record<TrustLevel, string> = {
  distrust: "Distrust",
  neutral: "Neutral",
  ally: "Ally",
  core: "Core Alliance",
};

const trustValues: Record<TrustLevel, number> = {
  distrust: 0,
  neutral: 33,
  ally: 66,
  core: 100,
};

export function TrustMeter({ trustLevel, size = "md", showLabel = true }: TrustMeterProps) {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const value = trustValues[trustLevel];
  const color = trustColors[trustLevel];

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-stone-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${color} h-full transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-${size === "sm" ? "xs" : size === "md" ? "sm" : "base"} text-stone-300 font-semibold`}>
          {trustLabels[trustLevel]}
        </span>
      )}
    </div>
  );
}

