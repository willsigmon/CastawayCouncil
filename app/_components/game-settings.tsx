'use client';

import { useState, useEffect } from 'react';

interface GameSettings {
  totalDays: number;
  mergeAt: number;
  fastForwardMode: boolean;
  statDecayMultiplier: number;
  advantageSpawnRate: number;
  weatherIntensity: number;
  randomEventChance: number;
}

interface GameSettingsProps {
  seasonId: string;
  isHost: boolean;
  seasonStatus: 'planned' | 'active' | 'completed';
}

export function GameSettings({ seasonId, isHost, seasonStatus }: GameSettingsProps) {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<GameSettings | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [seasonId]);

  async function fetchSettings() {
    try {
      const response = await fetch(`/api/seasons/${seasonId}/settings`);
      const data = await response.json();

      if (response.ok) {
        setSettings(data.settings);
        setEditedSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }

  async function handleSave() {
    if (!editedSettings || !isHost) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/seasons/${seasonId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedSettings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setIsEditing(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setEditedSettings(settings);
    setIsEditing(false);
  }

  if (!settings) {
    return <div className="text-gray-500">Loading settings...</div>;
  }

  const canEdit = isHost && seasonStatus === 'planned';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">⚙️ Game Settings</h3>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Edit Settings
          </button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Settings saved successfully!
        </div>
      )}

      {/* Warning for active seasons */}
      {seasonStatus !== 'planned' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
          ⚠️ Settings are locked once the season starts
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Basic Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h4 className="font-semibold mb-3 text-purple-600">Basic Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Total Days
                {isEditing && editedSettings && (
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={editedSettings.totalDays}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        totalDays: parseInt(e.target.value),
                      })
                    }
                    className="w-full mt-1"
                  />
                )}
              </label>
              <div className="text-2xl font-bold">
                {isEditing ? editedSettings?.totalDays : settings.totalDays} days
              </div>
              <div className="text-xs text-gray-500">Length of the season</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Merge At
                {isEditing && editedSettings && (
                  <input
                    type="range"
                    min="4"
                    max="20"
                    value={editedSettings.mergeAt}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        mergeAt: parseInt(e.target.value),
                      })
                    }
                    className="w-full mt-1"
                  />
                )}
              </label>
              <div className="text-2xl font-bold">
                {isEditing ? editedSettings?.mergeAt : settings.mergeAt} players
              </div>
              <div className="text-xs text-gray-500">
                Tribes merge when this many players remain
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={editedSettings?.fastForwardMode}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings!,
                        fastForwardMode: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                ) : (
                  <div className="w-4 h-4 flex items-center justify-center">
                    {settings.fastForwardMode ? '✅' : '❌'}
                  </div>
                )}
                <span className="text-sm">Fast-Forward Mode (1 min = 1 hour)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Difficulty Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h4 className="font-semibold mb-3 text-orange-600">Difficulty Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Stat Decay Rate
                {isEditing && editedSettings && (
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={editedSettings.statDecayMultiplier}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        statDecayMultiplier: parseFloat(e.target.value),
                      })
                    }
                    className="w-full mt-1"
                  />
                )}
              </label>
              <div className="text-2xl font-bold">
                {isEditing
                  ? editedSettings?.statDecayMultiplier.toFixed(1)
                  : settings.statDecayMultiplier.toFixed(1)}
                x
              </div>
              <div className="text-xs text-gray-500">
                {(isEditing ? editedSettings?.statDecayMultiplier : settings.statDecayMultiplier) <
                1
                  ? 'Easier (slower decay)'
                  : (isEditing
                      ? editedSettings?.statDecayMultiplier
                      : settings.statDecayMultiplier) > 1
                  ? 'Harder (faster decay)'
                  : 'Normal'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Weather Intensity
                {isEditing && editedSettings && (
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={editedSettings.weatherIntensity}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        weatherIntensity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full mt-1"
                  />
                )}
              </label>
              <div className="text-2xl font-bold">
                {isEditing
                  ? editedSettings?.weatherIntensity.toFixed(1)
                  : settings.weatherIntensity.toFixed(1)}
                x
              </div>
              <div className="text-xs text-gray-500">
                {(isEditing ? editedSettings?.weatherIntensity : settings.weatherIntensity) < 1
                  ? 'Milder weather'
                  : (isEditing ? editedSettings?.weatherIntensity : settings.weatherIntensity) > 1
                  ? 'More extreme weather'
                  : 'Normal weather'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Random Event Frequency
                {isEditing && editedSettings && (
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.1"
                    value={editedSettings.randomEventChance}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        randomEventChance: parseFloat(e.target.value),
                      })
                    }
                    className="w-full mt-1"
                  />
                )}
              </label>
              <div className="text-2xl font-bold">
                {isEditing
                  ? editedSettings?.randomEventChance.toFixed(1)
                  : settings.randomEventChance.toFixed(1)}
                x
              </div>
              <div className="text-xs text-gray-500">
                {(isEditing ? editedSettings?.randomEventChance : settings.randomEventChance) === 0
                  ? 'No random events'
                  : (isEditing ? editedSettings?.randomEventChance : settings.randomEventChance) <
                    1
                  ? 'Fewer events'
                  : (isEditing ? editedSettings?.randomEventChance : settings.randomEventChance) >
                    1
                  ? 'More events'
                  : 'Normal frequency'}
              </div>
            </div>
          </div>
        </div>

        {/* Reward Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h4 className="font-semibold mb-3 text-green-600">Reward Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Advantage Spawn Rate
                {isEditing && editedSettings && (
                  <input
                    type="range"
                    min="0"
                    max="3.0"
                    step="0.1"
                    value={editedSettings.advantageSpawnRate}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        advantageSpawnRate: parseFloat(e.target.value),
                      })
                    }
                    className="w-full mt-1"
                  />
                )}
              </label>
              <div className="text-2xl font-bold">
                {isEditing
                  ? editedSettings?.advantageSpawnRate.toFixed(1)
                  : settings.advantageSpawnRate.toFixed(1)}
                x
              </div>
              <div className="text-xs text-gray-500">
                {(isEditing
                  ? editedSettings?.advantageSpawnRate
                  : settings.advantageSpawnRate) === 0
                  ? 'No advantages'
                  : (isEditing ? editedSettings?.advantageSpawnRate : settings.advantageSpawnRate) <
                    1
                  ? 'Fewer advantages'
                  : (isEditing ? editedSettings?.advantageSpawnRate : settings.advantageSpawnRate) >
                    1
                  ? 'More advantages'
                  : 'Normal spawn rate'}
              </div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
            💡 Settings Guide
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Easier settings (0.5x) are great for new players</li>
            <li>• Normal settings (1.0x) provide balanced gameplay</li>
            <li>• Harder settings (2.0x) create intense survival challenges</li>
            <li>• Fast-forward mode speeds up time for testing</li>
            <li>• Settings cannot be changed once the season starts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
