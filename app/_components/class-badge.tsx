'use client';

export type PlayerClass = 'athlete' | 'strategist' | 'survivalist' | 'opportunist' | 'diplomat' | 'wildcard';

interface ClassBadgeProps {
  playerClass: PlayerClass;
  wildcardAbility?: PlayerClass;
  size?: 'sm' | 'md' | 'lg';
}

const classInfo: Record<PlayerClass, { name: string; icon: string; color: string; description: string }> = {
  athlete: {
    name: 'Athlete',
    icon: '💪',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
    description: '+5% physical challenge bonus',
  },
  strategist: {
    name: 'Strategist',
    icon: '🧠',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    description: '+1 extra hint on puzzle challenges',
  },
  survivalist: {
    name: 'Survivalist',
    icon: '🏕️',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
    description: 'Stats decay 15% slower, +10% find/fish success',
  },
  opportunist: {
    name: 'Opportunist',
    icon: '🎯',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    description: '+5% puzzle challenge bonus',
  },
  diplomat: {
    name: 'Diplomat',
    icon: '🤝',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    description: '+5% tribe effectiveness overall',
  },
  wildcard: {
    name: 'Wildcard',
    icon: '🎲',
    color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    description: 'Inherits random class ability daily (rotates post-tribal)',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2',
};

export function ClassBadge({ playerClass, wildcardAbility, size = 'md' }: ClassBadgeProps) {
  const info = classInfo[playerClass];
  const effectiveAbility = playerClass === 'wildcard' && wildcardAbility ? classInfo[wildcardAbility] : info;

  return (
    <div className="inline-block group relative">
      <div
        className={`
          ${info.color} ${sizeClasses[size]}
          border-2 rounded-full font-semibold
          inline-flex items-center gap-1
          transition-all cursor-help
          hover:scale-105
        `}
        title={info.description}
      >
        <span role="img" aria-label={info.name}>{info.icon}</span>
        <span>{info.name}</span>
        {playerClass === 'wildcard' && wildcardAbility && (
          <span className="text-xs opacity-75">
            → {classInfo[wildcardAbility].icon}
          </span>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-xs whitespace-normal">
          <p className="font-bold mb-1">{info.name}</p>
          <p className="text-gray-300">{info.description}</p>
          {playerClass === 'wildcard' && wildcardAbility && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="font-semibold">Today's Ability: {effectiveAbility.name}</p>
              <p className="text-gray-300">{effectiveAbility.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
