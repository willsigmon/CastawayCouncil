"use client";

import { useState, useEffect } from "react";

interface TradeHistoryProps {
  seasonId: string;
  playerId: string;
}

type Trade = {
  id: string;
  proposerId: string;
  proposerName?: string;
  recipientId: string;
  recipientName?: string;
  resourcesOfferedJson: Record<string, number>;
  resourcesRequestedJson: Record<string, number>;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message?: string;
  createdAt: string;
};

export function TradeHistory({ seasonId, playerId }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trade?seasonId=${seasonId}&playerId=${playerId}`)
      .then((res) => res.json())
      .then((data) => setTrades(data.trades || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [seasonId, playerId]);

  const handleAccept = async (tradeId: string) => {
    try {
      const res = await fetch("/api/trade/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId, action: "accept" }),
      });
      if (res.ok) {
        // Refresh trades
        fetch(`/api/trade?seasonId=${seasonId}&playerId=${playerId}`)
          .then((res) => res.json())
          .then((data) => setTrades(data.trades || []))
          .catch(console.error);
      }
    } catch (error) {
      console.error("Failed to accept trade:", error);
    }
  };

  const handleReject = async (tradeId: string) => {
    try {
      const res = await fetch("/api/trade/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId, action: "reject" }),
      });
      if (res.ok) {
        // Refresh trades
        fetch(`/api/trade?seasonId=${seasonId}&playerId=${playerId}`)
          .then((res) => res.json())
          .then((data) => setTrades(data.trades || []))
          .catch(console.error);
      }
    } catch (error) {
      console.error("Failed to reject trade:", error);
    }
  };

  if (loading) {
    return <div className="text-stone-400">Loading trades...</div>;
  }

  return (
    <div className="space-y-4">
      {trades.length === 0 ? (
        <div className="text-center py-8 text-stone-400">No trades yet</div>
      ) : (
        trades.map((trade) => (
          <div
            key={trade.id}
            className={`p-4 rounded-lg border ${
              trade.status === "accepted"
                ? "bg-green-900/20 border-green-700"
                : trade.status === "rejected" || trade.status === "cancelled"
                ? "bg-red-900/20 border-red-700"
                : "bg-stone-800/50 border-stone-700"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-stone-200">
                  {trade.proposerId === playerId ? "You" : trade.proposerName || "Unknown"} →{" "}
                  {trade.recipientId === playerId ? "You" : trade.recipientName || "Unknown"}
                </div>
                <div className="text-sm text-stone-400">
                  {new Date(trade.createdAt).toLocaleString()}
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-bold rounded ${
                  trade.status === "accepted"
                    ? "bg-green-500/20 text-green-300"
                    : trade.status === "rejected" || trade.status === "cancelled"
                    ? "bg-red-500/20 text-red-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {trade.status}
              </span>
            </div>

            {trade.message && <div className="text-sm text-stone-300 mb-2">{trade.message}</div>}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-green-400 mb-1">Offered</div>
                <div className="text-stone-300">
                  {Object.entries(trade.resourcesOfferedJson).map(([id, qty]) => (
                    <div key={id}>
                      Resource {id}: {qty}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-semibold text-blue-400 mb-1">Requested</div>
                <div className="text-stone-300">
                  {Object.entries(trade.resourcesRequestedJson).map(([id, qty]) => (
                    <div key={id}>
                      Resource {id}: {qty}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {trade.status === "pending" && trade.recipientId === playerId && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleAccept(trade.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(trade.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

