"use client";

import { useEffect, useState } from "react";

type TimelineEvent = {
  episode: number;
  phase: "camp" | "challenge" | "tribal";
  startsAt: string;
  endsAt: string;
  status: "past" | "current" | "future";
};

export function SeasonTimeline({ seasonId }: { seasonId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const response = await fetch(`/api/season/timeline?seasonId=${seasonId}`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error("Failed to load timeline:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [seasonId]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-stone-900/20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-300 ${
            event.status === "current"
              ? "bg-amber-900/30 border-amber-500 shadow-lg shadow-amber-900/40"
              : "bg-stone-900/20 border-stone-700 hover:border-stone-600"
          }`}
        >
          <div className="text-2xl">
            {event.phase === "camp" && "⛺"}
            {event.phase === "challenge" && "🏆"}
            {event.phase === "tribal" && "🔥"}
          </div>
          <div className="flex-1">
            <div className="font-bold text-amber-100">
              Episode {event.episode} · {event.phase}
            </div>
            <div className="text-xs text-stone-400">
              {new Date(event.startsAt).toLocaleDateString()} -{" "}
              {new Date(event.endsAt).toLocaleDateString()}
            </div>
          </div>
          {event.status === "current" && (
            <div className="px-2 py-1 bg-amber-500 text-black text-xs font-bold rounded animate-pulse">
              LIVE
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
