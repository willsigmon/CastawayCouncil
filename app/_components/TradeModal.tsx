"use client";

import { useState, useEffect } from "react";

interface TradeModalProps {
  seasonId: string;
  proposerId: string;
  recipientId: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Resource = {
  id: string;
  name: string;
  type: string;
};

type InventoryItem = {
  id: string;
  resourceId: string;
  resourceName: string;
  quantity: number;
};

export function TradeModal({
  seasonId,
  proposerId,
  recipientId,
  recipientName,
  isOpen,
  onClose,
  onSuccess,
}: TradeModalProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [offered, setOffered] = useState<Record<string, number>>({});
  const [requested, setRequested] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/inventory?seasonId=${seasonId}&playerId=${proposerId}`)
        .then((res) => res.json())
        .then((data) => setInventory(data.inventory || []))
        .catch(console.error);

      fetch(`/api/resources?seasonId=${seasonId}`)
        .then((res) => res.json())
        .then((data) => setResources(data.resources || []))
        .catch(console.error);
    }
  }, [isOpen, seasonId, proposerId]);

  const handleOfferChange = (resourceId: string, quantity: number) => {
    if (quantity <= 0) {
      const newOffered = { ...offered };
      delete newOffered[resourceId];
      setOffered(newOffered);
    } else {
      setOffered({ ...offered, [resourceId]: quantity });
    }
  };

  const handleRequestChange = (resourceId: string, quantity: number) => {
    if (quantity <= 0) {
      const newRequested = { ...requested };
      delete newRequested[resourceId];
      setRequested(newRequested);
    } else {
      setRequested({ ...requested, [resourceId]: quantity });
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(offered).length === 0 || Object.keys(requested).length === 0) {
      alert("Please offer and request at least one resource");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId,
          proposerId,
          recipientId,
          resourcesOfferedJson: offered,
          resourcesRequestedJson: requested,
          message: message || undefined,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create trade");
      }
    } catch (error) {
      console.error("Failed to create trade:", error);
      alert("Failed to create trade");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-stone-800 rounded-lg border border-stone-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-amber-100 mb-4">Trade with {recipientName}</h2>

        <div className="grid grid-cols-2 gap-6 mb-4">
          {/* Offered Resources */}
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-2">You Offer</h3>
            <div className="space-y-2">
              {inventory.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="text-stone-300 flex-1">{item.resourceName}</span>
                  <input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={offered[item.resourceId] || 0}
                    onChange={(e) => handleOfferChange(item.resourceId, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-stone-700 border border-stone-600 rounded text-stone-100"
                  />
                  <span className="text-stone-500 text-sm">/ {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Requested Resources */}
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">You Request</h3>
            <div className="space-y-2">
              {resources.map((resource) => (
                <div key={resource.id} className="flex items-center gap-2">
                  <span className="text-stone-300 flex-1">{resource.name}</span>
                  <input
                    type="number"
                    min="0"
                    value={requested[resource.id] || 0}
                    onChange={(e) => handleRequestChange(resource.id, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-stone-700 border border-stone-600 rounded text-stone-100"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-stone-300 mb-2">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-stone-100"
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || Object.keys(offered).length === 0 || Object.keys(requested).length === 0}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Trade"}
          </button>
        </div>
      </div>
    </div>
  );
}

