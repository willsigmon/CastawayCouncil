'use client';

import { useEffect, useState } from 'react';

interface PhaseIndicatorProps {
  currentPhase: 'camp' | 'challenge' | 'vote';
  phaseEndsAt: Date;
}

const phaseInfo = {
  camp: {
    label: 'Camp Phase',
    icon: '🏕️',
    description: 'Gather resources, socialize, and prepare',
    color: 'bg-green-600',
  },
  challenge: {
    label: 'Challenge Phase',
    icon: '⚔️',
    description: 'Compete for immunity and rewards',
    color: 'bg-blue-600',
  },
  vote: {
    label: 'Tribal Council',
    icon: '🔥',
    description: 'Vote to eliminate a player',
    color: 'bg-red-600',
  },
};

export function PhaseIndicator({ currentPhase, phaseEndsAt }: PhaseIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = phaseEndsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Phase ending...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  const info = phaseInfo[currentPhase];

  return (
    <div className={`${info.color} text-white rounded-lg p-4 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label={info.label}>
            {info.icon}
          </span>
          <div>
            <h2 className="text-xl font-bold">{info.label}</h2>
            <p className="text-sm opacity-90">{info.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-75">Time Remaining</p>
          <p className="text-2xl font-mono font-bold" aria-live="polite">
            {timeRemaining}
          </p>
        </div>
      </div>
    </div>
  );
}
