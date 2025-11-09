"use client";

import { useState, useEffect } from "react";

interface CraftingModalProps {
  seasonId: string;
  playerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Recipe = {
  id: string;
  name: string;
  description?: string;
  inputsJson: Record<string, number>;
  outputsJson: Record<string, number>;
  craftingTime: number;
};

type Resource = {
  id: string;
  name: string;
};

type InventoryItem = {
  id: string;
  resourceId: string;
  resourceName: string;
  quantity: number;
};

export function CraftingModal({ seasonId, playerId, isOpen, onClose, onSuccess }: CraftingModalProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch(`/api/crafting/recipes?seasonId=${seasonId}&status=discovered`).then((res) => res.json()),
        fetch(`/api/resources?seasonId=${seasonId}`).then((res) => res.json()),
        fetch(`/api/inventory?seasonId=${seasonId}&playerId=${playerId}`).then((res) => res.json()),
      ])
        .then(([recipesData, resourcesData, inventoryData]) => {
          setRecipes(recipesData.recipes || []);
          setResources(resourcesData.resources || []);
          setInventory(inventoryData.inventory || []);
        })
        .catch(console.error);
    }
  }, [isOpen, seasonId, playerId]);

  const canCraft = (recipe: Recipe) => {
    for (const [resourceId, quantity] of Object.entries(recipe.inputsJson)) {
      const item = inventory.find((inv) => inv.resourceId === resourceId);
      if (!item || item.quantity < quantity) {
        return false;
      }
    }
    return true;
  };

  const handleCraft = async () => {
    if (!selectedRecipe) return;

    setLoading(true);
    try {
      const res = await fetch("/api/crafting/craft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: selectedRecipe.id,
          seasonId,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to craft item");
      }
    } catch (error) {
      console.error("Failed to craft:", error);
      alert("Failed to craft item");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-stone-800 rounded-lg border border-stone-700 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-amber-100 mb-4">Crafting</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Recipe List */}
          <div>
            <h3 className="text-lg font-semibold text-stone-200 mb-2">Recipes</h3>
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    selectedRecipe?.id === recipe.id
                      ? "bg-amber-900/30 border-amber-600"
                      : canCraft(recipe)
                      ? "bg-stone-700/50 border-stone-600 hover:border-stone-500"
                      : "bg-stone-800/30 border-stone-700 opacity-50"
                  }`}
                >
                  <div className="font-semibold text-stone-200">{recipe.name}</div>
                  {recipe.description && (
                    <div className="text-sm text-stone-400">{recipe.description}</div>
                  )}
                  {!canCraft(recipe) && (
                    <div className="text-xs text-red-400 mt-1">Insufficient resources</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recipe Details */}
          <div>
            {selectedRecipe ? (
              <>
                <h3 className="text-lg font-semibold text-stone-200 mb-2">{selectedRecipe.name}</h3>
                {selectedRecipe.description && (
                  <p className="text-sm text-stone-400 mb-4">{selectedRecipe.description}</p>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-red-400 mb-2">Required:</div>
                    <div className="space-y-1">
                      {Object.entries(selectedRecipe.inputsJson).map(([resourceId, quantity]) => {
                        const resource = resources.find((r) => r.id === resourceId);
                        const item = inventory.find((inv) => inv.resourceId === resourceId);
                        const hasEnough = item && item.quantity >= quantity;
                        return (
                          <div
                            key={resourceId}
                            className={`text-sm ${hasEnough ? "text-stone-300" : "text-red-400"}`}
                          >
                            {resource?.name || resourceId}: {quantity} {hasEnough && `(have ${item?.quantity})`}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-green-400 mb-2">Produces:</div>
                    <div className="space-y-1">
                      {Object.entries(selectedRecipe.outputsJson).map(([resourceId, quantity]) => {
                        const resource = resources.find((r) => r.id === resourceId);
                        return (
                          <div key={resourceId} className="text-sm text-stone-300">
                            {resource?.name || resourceId}: {quantity}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleCraft}
                    disabled={loading || !canCraft(selectedRecipe)}
                    className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Crafting..." : "Craft"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-stone-400">Select a recipe to view details</div>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

