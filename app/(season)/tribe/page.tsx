"use client";

import { Chat } from "@/components/Chat";
import { StatHUD } from "@/components/StatHUD";
import { useSeason } from "@/components/SeasonContext";
import { useEffect, useState } from "react";
import { TradeModal } from "@/app/_components/TradeModal";
import { TradeHistory } from "@/app/_components/TradeHistory";

export default function TribePage() {
  const { currentSeason, currentPlayer } = useSeason();
  const [tribeId, setTribeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tribeMembers, setTribeMembers] = useState<Array<{ id: string; displayName: string }>>([]);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedTradeRecipient, setSelectedTradeRecipient] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!currentSeason || !currentPlayer) {
      setLoading(false);
      return;
    }

    // Fetch tribe ID for player
    Promise.all([
      fetch(`/api/player/tribe?seasonId=${currentSeason.id}`).then((res) => res.json()),
      fetch(`/api/tribe/members?seasonId=${currentSeason.id}`).then((res) => res.json()).catch(() => ({ members: [] })),
    ])
      .then(([tribeData, membersData]) => {
        setTribeId(tribeData.tribeId || null);
        setTribeMembers(membersData.members || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [currentSeason, currentPlayer]);

  if (!currentSeason || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not in a Season</h2>
          <p className="text-gray-400 mb-4">Join a season to access tribe chat.</p>
          <a href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!tribeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Tribe Assigned</h2>
          <p className="text-gray-400">You haven&apos;t been assigned to a tribe yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Tribe</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTradeModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold transition-colors"
            >
              Trade
            </button>
          </div>
        </div>

        {/* Tribe Members */}
        {tribeMembers.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-stone-200 mb-3">Tribe Members</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tribeMembers
                .filter((m) => m.id !== currentPlayer.id)
                .map((member) => (
                  <div
                    key={member.id}
                    className="p-3 bg-stone-800/50 rounded-lg border border-stone-700 hover:border-stone-600 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedTradeRecipient({ id: member.id, name: member.displayName });
                      setShowTradeModal(true);
                    }}
                  >
                    <div className="font-semibold text-stone-200">{member.displayName}</div>
                    <div className="text-xs text-stone-400 mt-1">Click to trade</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Trade History */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-stone-200 mb-3">Trade History</h2>
          <TradeHistory seasonId={currentSeason.id} playerId={currentPlayer.id} />
        </div>

        {/* Tribe Chat */}
        <div>
          <h2 className="text-lg font-semibold text-stone-200 mb-3">Tribe Chat</h2>
          <Chat channelType="tribe" seasonId={currentSeason.id} tribeId={tribeId} />
        </div>
      </div>
      <StatHUD energy={75} hunger={60} thirst={80} social={65} />

      {selectedTradeRecipient && (
        <TradeModal
          seasonId={currentSeason.id}
          proposerId={currentPlayer.id}
          recipientId={selectedTradeRecipient.id}
          recipientName={selectedTradeRecipient.name}
          isOpen={showTradeModal}
          onClose={() => {
            setShowTradeModal(false);
            setSelectedTradeRecipient(null);
          }}
          onSuccess={() => {
            setShowTradeModal(false);
            setSelectedTradeRecipient(null);
          }}
        />
      )}
    </div>
  );
}
