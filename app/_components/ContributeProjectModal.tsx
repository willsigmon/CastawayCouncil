"use client";

import { useState, useEffect } from "react";
import { useSeason } from "@/app/_components/SeasonContext";

interface ContributeProjectModalProps {
  projectId: string;
  seasonId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Project = {
  id: string;
  name: string;
  progress: number;
  targetProgress: number;
  requiredResourcesJson?: Record<string, number>;
};

type InventoryItem = {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  quantity: number;
};

export function ContributeProjectModal({
  projectId,
  seasonId,
  isOpen,
  onClose,
  onSuccess,
}: ContributeProjectModalProps) {
  const { currentPlayer } = useSeason();
  const [project, setProject] = useState<Project | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [formData, setFormData] = useState({
    progressAdded: "0",
    resourcesContributed: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      setFetching(true);
      Promise.all([
        fetch(`/api/projects?seasonId=${seasonId}&status=active`).then((res) => res.json()),
        currentPlayer
          ? fetch(`/api/inventory?seasonId=${seasonId}&playerId=${currentPlayer.id}`).then((res) => res.json())
          : Promise.resolve({ inventory: [] }),
      ])
        .then(([projectsRes, inventoryRes]) => {
          const foundProject = projectsRes.projects?.find((p: Project) => p.id === projectId);
          setProject(foundProject || null);
          setInventory(inventoryRes.inventory || []);
        })
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [isOpen, projectId, seasonId, currentPlayer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const resourcesContributedJson: Record<string, number> = {};
      Object.entries(formData.resourcesContributed).forEach(([resourceId, quantity]) => {
        if (quantity > 0) {
          resourcesContributedJson[resourceId] = quantity;
        }
      });

      const payload: any = {
        projectId,
        progressAdded: parseInt(formData.progressAdded) || 0,
      };

      if (Object.keys(resourcesContributedJson).length > 0) {
        payload.resourcesContributedJson = resourcesContributedJson;
      }

      const response = await fetch("/api/projects/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to contribute to project");
      }

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        progressAdded: "0",
        resourcesContributed: {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to contribute to project");
    } finally {
      setLoading(false);
    }
  };

  const updateResourceContribution = (resourceId: string, quantity: number) => {
    setFormData({
      ...formData,
      resourcesContributed: {
        ...formData.resourcesContributed,
        [resourceId]: Math.max(0, quantity),
      },
    });
  };

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-stone-900 border border-stone-700 rounded-lg p-6">
          <div className="text-stone-300">Loading...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-stone-900 border border-stone-700 rounded-lg p-6">
          <div className="text-red-400 mb-4">Project not found</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-stone-900 border border-stone-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-blue-100">Contribute to {project.name}</h2>

        <div className="mb-4">
          <div className="text-sm text-stone-400 mb-2">
            Progress: {project.progress} / {project.targetProgress}
          </div>
          <div className="w-full bg-stone-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(project.progress / project.targetProgress) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Progress Contribution */}
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-2">Progress Added</label>
            <input
              type="number"
              value={formData.progressAdded}
              onChange={(e) => setFormData({ ...formData, progressAdded: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
              min="0"
            />
          </div>

          {/* Resource Contributions */}
          {inventory.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-2">Resources</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {inventory.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-stone-800 rounded">
                    <span className="text-lg">
                      {item.resourceType === "food" && "🍎"}
                      {item.resourceType === "water" && "💧"}
                      {item.resourceType === "materials" && "🪵"}
                      {item.resourceType === "tools" && "🔧"}
                      {item.resourceType === "medicine" && "💊"}
                      {item.resourceType === "luxury" && "✨"}
                      {!["food", "water", "materials", "tools", "medicine", "luxury"].includes(item.resourceType) &&
                        "📦"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-stone-200 truncate">{item.resourceName}</div>
                      <div className="text-xs text-stone-400">Available: {item.quantity}</div>
                    </div>
                    <input
                      type="number"
                      value={formData.resourcesContributed[item.resourceId] || 0}
                      onChange={(e) =>
                        updateResourceContribution(item.resourceId, parseInt(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1 bg-stone-700 border border-stone-600 rounded text-stone-100 text-sm"
                      min="0"
                      max={item.quantity}
                    />
                  </div>
                ))}
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
              disabled={loading || (parseInt(formData.progressAdded) === 0 && Object.values(formData.resourcesContributed).every((q) => q === 0))}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Contributing..." : "Contribute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
