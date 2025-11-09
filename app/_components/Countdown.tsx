"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  closesAt: string;
  onComplete?: () => void;
}

export function Countdown({ closesAt, onComplete }: CountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalMinutes: number;
  } | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(closesAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        onComplete?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const totalMinutes = Math.floor(diff / (1000 * 60));

      setTimeRemaining({ hours, minutes, seconds, totalMinutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [closesAt, onComplete]);

  if (!timeRemaining) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border-2 border-red-500 rounded-lg">
        <span className="text-red-400 font-semibold text-lg">⏱️ Phase Ended</span>
      </div>
    );
  }

  // Urgency levels
  const isUrgent = timeRemaining.totalMinutes < 60; // Less than 1 hour
  const isCritical = timeRemaining.totalMinutes < 15; // Less than 15 minutes

  const urgencyStyles = isCritical
    ? "bg-red-600/20 border-red-500 text-red-300 animate-pulse"
    : isUrgent
      ? "bg-amber-600/20 border-amber-500 text-amber-300"
      : "bg-emerald-600/20 border-emerald-500 text-emerald-300";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 border-2 rounded-lg transition-all duration-300 ${urgencyStyles}`}
      aria-live="polite"
      role="timer"
    >
      <span className="text-sm font-semibold">
        {isCritical ? "⚠️" : isUrgent ? "⏰" : "⏱️"} Time remaining:
      </span>
      <span className="font-mono font-bold text-lg">
        {String(timeRemaining.hours).padStart(2, "0")}:
        {String(timeRemaining.minutes).padStart(2, "0")}:
        {String(timeRemaining.seconds).padStart(2, "0")}
      </span>
      {isCritical && (
        <span className="text-xs font-semibold uppercase tracking-wide">
          Hurry!
        </span>
      )}
    </div>
  );
}
