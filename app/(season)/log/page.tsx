"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CampaignEventFeed } from "@/app/_components/CampaignEventFeed";

export default function PublicLogPage() {
  const params = useParams();
  const seasonId = params.seasonId as string;
  const [filterType, setFilterType] = useState<string>("");
  const [filterPhase, setFilterPhase] = useState<"camp" | "challenge" | "vote" | "">("");

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-amber-100">Campaign Event Log</h1>

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-semibold text-stone-300 mb-2">Filter by Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
          >
            <option value="">All Types</option>
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
        <div>
          <label className="block text-sm font-semibold text-stone-300 mb-2">Filter by Phase</label>
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value as typeof filterPhase)}
            className="px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
          >
            <option value="">All Phases</option>
            <option value="camp">Camp</option>
            <option value="challenge">Challenge</option>
            <option value="vote">Vote</option>
          </select>
        </div>
      </div>

      <CampaignEventFeed
        seasonId={seasonId}
        filterType={filterType || undefined}
        filterPhase={filterPhase || undefined}
      />
    </div>
  );
}
