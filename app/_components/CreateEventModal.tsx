"use client";

import { useState } from "react";

interface CreateEventModalProps {
  seasonId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type EventType =
  | "storm"
  | "supply_drop"
  | "wildlife_encounter"
  | "tribe_swap"
  | "exile_island"
  | "reward_challenge"
  | "immunity_idol_clue"
  | "social_twist"
  | "resource_discovery"
  | "custom";

export function CreateEventModal({ seasonId, isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    type: "custom" as EventType,
    title: "",
    description: "",
    scheduledDay: "",
    scheduledPhase: "" as "camp" | "challenge" | "vote" | "",
    immediate: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        seasonId,
        type: formData.type,
        title: formData.title,
        description: formData.description,
      };

      if (!formData.immediate) {
        if (formData.scheduledDay) {
          payload.scheduledDay = parseInt(formData.scheduledDay);
        }
        if (formData.scheduledPhase) {
          payload.scheduledPhase = formData.scheduledPhase;
        }
      }

      const response = await fetch("/api/campaign/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create event");
      }

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        type: "custom",
        title: "",
        description: "",
        scheduledDay: "",
        scheduledPhase: "",
        immediate: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-stone-900 border border-stone-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-amber-100">Create Campaign Event</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-2">Event Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
              required
            >
              <option value="storm">⛈️ Storm</option>
              <option value="supply_drop">📦 Supply Drop</option>
              <option value="wildlife_encounter">🐍 Wildlife Encounter</option>
              <option value="tribe_swap">🔄 Tribe Swap</option>
              <option value="exile_island">🏝️ Exile Island</option>
              <option value="reward_challenge">🎁 Reward Challenge</option>
              <option value="immunity_idol_clue">💎 Immunity Idol Clue</option>
              <option value="social_twist">🎭 Social Twist</option>
              <option value="resource_discovery">💎 Resource Discovery</option>
              <option value="custom">✨ Custom</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
              required
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
              required
              rows={4}
              maxLength={2000}
            />
          </div>

          {/* Scheduling */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-300">
              <input
                type="checkbox"
                checked={formData.immediate}
                onChange={(e) => setFormData({ ...formData, immediate: e.target.checked })}
                className="rounded"
              />
              Trigger immediately
            </label>
          </div>

          {!formData.immediate && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-300 mb-2">Scheduled Day</label>
                <input
                  type="number"
                  value={formData.scheduledDay}
                  onChange={(e) => setFormData({ ...formData, scheduledDay: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-300 mb-2">Scheduled Phase</label>
                <select
                  value={formData.scheduledPhase}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledPhase: e.target.value as "camp" | "challenge" | "vote" | "" })
                  }
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
                >
                  <option value="">Any</option>
                  <option value="camp">Camp</option>
                  <option value="challenge">Challenge</option>
                  <option value="vote">Vote</option>
                </select>
              </div>
            </div>
          )}

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
