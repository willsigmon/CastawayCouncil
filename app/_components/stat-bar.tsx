'use client';

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: 'energy' | 'hunger' | 'thirst' | 'social';
}

const colorClasses = {
  energy: 'bg-yellow-500',
  hunger: 'bg-orange-500',
  thirst: 'bg-blue-500',
  social: 'bg-purple-500',
};

const lowThreshold = 30;
const mediumThreshold = 60;

export function StatBar({ label, value, max, color }: StatBarProps) {
  const percentage = (value / max) * 100;
  const isLow = value < lowThreshold;
  const isMedium = value >= lowThreshold && value < mediumThreshold;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">{label}</span>
        <span className={isLow ? 'text-red-500 font-bold' : ''}>
          {value}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colorClasses[color]} ${
            isLow ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${label}: ${value} out of ${max}`}
        />
      </div>
      {isLow && <p className="text-xs text-red-500">⚠️ Critical</p>}
      {isMedium && <p className="text-xs text-yellow-600">⚡ Low</p>}
    </div>
  );
}
