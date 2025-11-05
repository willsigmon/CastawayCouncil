'use client';

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  stat: 'energy' | 'hunger' | 'thirst' | 'comfort';
}

interface StatsGridProps {
  hunger: number;
  thirst: number;
  comfort: number;
  energy: number;
  medicalAlert?: boolean;
}

const colorClasses = {
  energy: 'bg-yellow-500',
  hunger: 'bg-orange-500',
  thirst: 'bg-blue-500',
  comfort: 'bg-green-500',
};

const iconMap = {
  energy: '⚡',
  hunger: '🍎',
  thirst: '💧',
  comfort: '🛏️',
};

const lowThreshold = 30;
const mediumThreshold = 60;

export function StatBar({ label, value, max, stat }: StatBarProps) {
  const percentage = (value / max) * 100;
  const isLow = value < lowThreshold;
  const isMedium = value >= lowThreshold && value < mediumThreshold;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">
          <span role="img" aria-label={label}>{iconMap[stat]}</span> {label}
        </span>
        <span className={isLow ? 'text-red-500 font-bold' : ''}>
          {value}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colorClasses[stat]} ${
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

export function StatsGrid({ hunger, thirst, comfort, energy, medicalAlert = false }: StatsGridProps) {
  const totalStats = hunger + thirst + comfort;
  const isCritical = totalStats <= 50;

  return (
    <div className="space-y-4">
      {(medicalAlert || isCritical) && (
        <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-lg p-4 animate-pulse">
          <p className="text-red-800 dark:text-red-200 font-bold text-center text-lg">
            🚨 MEDICAL ALERT 🚨
          </p>
          <p className="text-red-700 dark:text-red-300 text-center mt-2">
            Total stats: <span className="font-bold">{totalStats}/300</span> (Critical threshold: 50)
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm text-center mt-2">
            You have 15 minutes to improve your stats or you will be medically evacuated!
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
        <StatBar label="Energy" value={energy} max={100} stat="energy" />
        <div className="text-xs text-gray-500 dark:text-gray-400 pl-1 -mt-2">
          Auto-calculated from H/T/C average
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
        <StatBar label="Hunger" value={hunger} max={100} stat="hunger" />
        <StatBar label="Thirst" value={thirst} max={100} stat="thirst" />
        <StatBar label="Comfort" value={comfort} max={100} stat="comfort" />

        <div className="pt-2 mt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total H+T+C:</span>
            <span className={`font-bold ${
              totalStats <= 50 ? 'text-red-600' :
              totalStats <= 150 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {totalStats}/300
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Medical evacuation at ≤50 total
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <span className="font-bold">💡 Tip:</span> Stats decay daily. Hunger: -15, Thirst: -20, Comfort: -10
          {' '}(Survivalists get 15% slower decay)
        </p>
      </div>
    </div>
  );
}
