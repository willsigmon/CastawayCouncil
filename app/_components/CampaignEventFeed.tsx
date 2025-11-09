"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/_lib/supabase/client";

interface CampaignEventFeedProps {
  seasonId: string;
  filterType?: string;
  filterDay?: number;
  filterPhase?: "camp" | "challenge" | "vote";
}

type CampaignEvent = {
  id: string;
  type: string;
  title: string;
  description: string;
  scheduledDay?: number;
  scheduledPhase?: string;
  triggeredAt?: string;
  createdAt: string;
};

export function CampaignEventFeed({
  seasonId,
  filterType,
  filterDay,
  filterPhase,
}: CampaignEventFeedProps) {
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchEvents = async (pageOffset = 0, append = false) => {
    try {
      const params = new URLSearchParams({
        seasonId,
        status: "all",
        limit: "20",
        offset: pageOffset.toString(),
      });
      const response = await fetch(`/api/campaign/events?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        let filteredEvents = data.events || [];

        // Apply filters
        if (filterType) {
          filteredEvents = filteredEvents.filter((e: CampaignEvent) => e.type === filterType);
        }
        if (filterDay) {
          filteredEvents = filteredEvents.filter((e: CampaignEvent) => e.scheduledDay === filterDay);
        }
        if (filterPhase) {
          filteredEvents = filteredEvents.filter((e: CampaignEvent) => e.scheduledPhase === filterPhase);
        }

        // Sort by triggeredAt (triggered first) then createdAt
        filteredEvents.sort((a: CampaignEvent, b: CampaignEvent) => {
          if (a.triggeredAt && !b.triggeredAt) return -1;
          if (!a.triggeredAt && b.triggeredAt) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        if (append) {
          setEvents((prev) => [...prev, ...filteredEvents]);
        } else {
          setEvents(filteredEvents);
        }
        setHasMore(filteredEvents.length === 20);
      }
    } catch (error) {
      console.error("Failed to load campaign events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchEvents(0, false);

    // Set up Supabase Realtime subscription with debouncing
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`event-feed:${seasonId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "campaign_events",
            filter: `season_id=eq.${seasonId}`,
          },
          () => {
            // Debounce rapid updates
            setDebounceTimer((prevTimer) => {
              if (prevTimer) {
                clearTimeout(prevTimer);
              }
              return setTimeout(() => {
                fetchEvents(0, false);
              }, 500);
            });
          }
        )
        .subscribe();

      return () => {
        try {
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          supabase.removeChannel(channel);
        } catch {
          // Ignore cleanup errors
        }
      };
    } catch (error) {
      console.error("Failed to set up event feed realtime subscription:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId, filterType, filterDay, filterPhase]);

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      storm: "⛈️",
      supply_drop: "📦",
      wildlife_encounter: "🐍",
      tribe_swap: "🔄",
      exile_island: "🏝️",
      reward_challenge: "🎁",
      immunity_idol_clue: "💎",
      social_twist: "🎭",
      resource_discovery: "💎",
    };
    return icons[type] || "✨";
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      storm: "bg-red-900/20 border-red-700",
      supply_drop: "bg-green-900/20 border-green-700",
      wildlife_encounter: "bg-orange-900/20 border-orange-700",
      tribe_swap: "bg-blue-900/20 border-blue-700",
      exile_island: "bg-cyan-900/20 border-cyan-700",
      reward_challenge: "bg-yellow-900/20 border-yellow-700",
      immunity_idol_clue: "bg-purple-900/20 border-purple-700",
      social_twist: "bg-pink-900/20 border-pink-700",
      resource_discovery: "bg-emerald-900/20 border-emerald-700",
    };
    return colors[type] || "bg-purple-900/20 border-purple-700";
  };

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-stone-800/50 rounded-lg border border-stone-700 h-20" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        <p>No campaign events found</p>
        {(filterType || filterDay || filterPhase) && (
          <p className="text-sm text-stone-500 mt-2">Try adjusting your filters</p>
        )}
      </div>
    );
  }

  const loadMore = () => {
    const newOffset = offset + 20;
    setOffset(newOffset);
    fetchEvents(newOffset, true);
  };

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className={`p-4 rounded-lg border transition-all cursor-pointer hover:border-opacity-80 ${
            getEventColor(event.type)
          } ${event.triggeredAt ? "opacity-75" : ""}`}
          onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">{getEventIcon(event.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-stone-100 text-lg">{event.title}</h3>
                {event.triggeredAt && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded">
                    Triggered
                  </span>
                )}
                {!event.triggeredAt && event.scheduledDay && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded">
                    Scheduled
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-400 mb-2 line-clamp-2">{event.description}</p>
              <div className="flex items-center gap-4 text-xs text-stone-500">
                <span className="capitalize">{event.type.replace(/_/g, " ")}</span>
                {event.scheduledDay && (
                  <>
                    <span>•</span>
                    <span>Day {event.scheduledDay}</span>
                  </>
                )}
                {event.scheduledPhase && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{event.scheduledPhase}</span>
                  </>
                )}
                {event.triggeredAt && (
                  <>
                    <span>•</span>
                    <span>Triggered {new Date(event.triggeredAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>
              {expandedEvent === event.id && (
                <div className="mt-3 pt-3 border-t border-stone-700">
                  <p className="text-sm text-stone-300 whitespace-pre-wrap">{event.description}</p>
                  <div className="mt-2 text-xs text-stone-500">
                    Created: {new Date(event.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {hasMore && (
        <button
          onClick={loadMore}
          className="w-full px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded transition-colors"
        >
          Load More
        </button>
      )}
    </div>
  );
}
