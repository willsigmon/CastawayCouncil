"use client";

import { useState, useEffect } from "react";
import { useSeason } from "@/app/_components/SeasonContext";

interface CreateProjectModalProps {
  seasonId: string;
  tribeId?: string;
  playerId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({
  seasonId,
  tribeId,
  playerId,
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const { currentPlayer } = useSeason();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetProgress: "100",
    ownerType: tribeId ? "tribe" : "player" as "tribe" | "player",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tribeId) {
      setFormData((prev) => ({ ...prev, ownerType: "tribe" }));
    } else if (playerId) {
      setFormData((prev) => ({ ...prev, ownerType: "player" }));
    }
  }, [tribeId, playerId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        seasonId,
        name: formData.name,
        description: formData.description,
        targetProgress: parseInt(formData.targetProgress),
        status: "planning",
      };

      if (formData.ownerType === "tribe" && tribeId) {
        payload.tribeId = tribeId;
      } else if (formData.ownerType === "player") {
        payload.playerId = playerId || currentPlayer?.id;
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: "",
        description: "",
        targetProgress: "100",
        ownerType: tribeId ? "tribe" : "player",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
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
        <h2 className="text-2xl font-bold mb-4 text-blue-100">Create Project</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-2">Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

          {/* Target Progress */}
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-2">Target Progress</label>
            <input
              type="number"
              value={formData.targetProgress}
              onChange={(e) => setFormData({ ...formData, targetProgress: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
              required
              min="1"
            />
          </div>

          {/* Owner Type (if both options available) */}
          {tribeId && !playerId && (
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-2">Owner</label>
              <select
                value={formData.ownerType}
                onChange={(e) => setFormData({ ...formData, ownerType: e.target.value as "tribe" | "player" })}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
              >
                <option value="tribe">Tribe Project</option>
                <option value="player">Personal Project</option>
              </select>
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
