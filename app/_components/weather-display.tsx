'use client';

import { useEffect, useState } from 'react';

export type WeatherType = 'sunny' | 'rain' | 'heat' | 'storm' | 'cold';

interface WeatherData {
  weatherType: WeatherType;
  severity: number;
  description: string;
  hungerModifier: number;
  thirstModifier: number;
  comfortModifier: number;
  warning: string | null;
  day: number;
}

interface WeatherDisplayProps {
  seasonId: string;
  day?: number;
}

const weatherIcons: Record<WeatherType, string> = {
  sunny: '☀️',
  rain: '🌧️',
  heat: '🌡️',
  storm: '⛈️',
  cold: '❄️',
};

const weatherColors: Record<WeatherType, string> = {
  sunny: 'from-yellow-400 to-orange-400',
  rain: 'from-blue-400 to-blue-600',
  heat: 'from-red-400 to-orange-500',
  storm: 'from-gray-600 to-gray-800',
  cold: 'from-cyan-300 to-blue-400',
};

const severityLabels: Record<number, string> = {
  1: 'Mild',
  2: 'Moderate',
  3: 'Severe',
};

export function WeatherDisplay({ seasonId, day }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = new URL('/api/weather', window.location.origin);
        url.searchParams.set('seasonId', seasonId);
        if (day) url.searchParams.set('day', day.toString());

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setWeather(data);
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [seasonId, day]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg p-4 shadow-lg animate-pulse">
        <div className="h-6 bg-white/30 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-white/30 rounded w-3/4"></div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const icon = weatherIcons[weather.weatherType];
  const colorGradient = weatherColors[weather.weatherType];
  const severityLabel = severityLabels[weather.severity];

  return (
    <div className="space-y-3">
      {/* Weather Warning */}
      {weather.warning && (
        <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-lg p-4 animate-pulse">
          <p className="text-red-800 dark:text-red-200 font-bold text-center">
            {weather.warning}
          </p>
        </div>
      )}

      {/* Weather Card */}
      <div className={`bg-gradient-to-r ${colorGradient} text-white rounded-lg p-4 shadow-lg`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{icon}</span>
            <div>
              <h3 className="text-xl font-bold capitalize">
                {weather.weatherType}
              </h3>
              <p className="text-sm opacity-90">{severityLabel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">Day</p>
            <p className="text-2xl font-bold">{weather.day}</p>
          </div>
        </div>

        <p className="text-sm mb-3 opacity-95">{weather.description}</p>

        {/* Stat Effects */}
        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-xs font-semibold mb-2 opacity-90">Weather Effects:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span>🍎</span>
              <span className={weather.hungerModifier < 0 ? 'text-red-200' : 'text-green-200'}>
                {weather.hungerModifier > 0 ? '+' : ''}{weather.hungerModifier}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>💧</span>
              <span className={weather.thirstModifier < 0 ? 'text-red-200' : 'text-green-200'}>
                {weather.thirstModifier > 0 ? '+' : ''}{weather.thirstModifier}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>🛏️</span>
              <span className={weather.comfortModifier < 0 ? 'text-red-200' : 'text-green-200'}>
                {weather.comfortModifier > 0 ? '+' : ''}{weather.comfortModifier}
              </span>
            </div>
          </div>
        </div>

        {/* Preparation Tips */}
        <div className="mt-3 pt-3 border-t border-white/30">
          <p className="text-xs opacity-90">
            💡 <span className="font-semibold">Tip:</span>{' '}
            {getWeatherTip(weather.weatherType, weather.severity)}
          </p>
        </div>
      </div>
    </div>
  );
}

function getWeatherTip(weatherType: WeatherType, severity: number): string {
  switch (weatherType) {
    case 'sunny':
      return 'Great day for gathering resources! But stay hydrated.';
    case 'rain':
      return severity >= 2
        ? 'Build shelter to stay dry and maintain comfort.'
        : 'Free water! But keep your camp supplies dry.';
    case 'heat':
      return 'Gather water immediately and rest in shade. Fire pit helps regulate temperature.';
    case 'storm':
      return 'Build shelter ASAP! Storms reduce comfort significantly.';
    case 'cold':
      return 'Build a fire to stay warm and maintain hunger levels.';
    default:
      return 'Plan your actions carefully based on the weather.';
  }
}
