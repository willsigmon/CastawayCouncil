"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/_lib/supabase/client";

type TimelineEvent = {
  episode: number;
  phase: "camp" | "challenge" | "tribal";
  startsAt: string;
  endsAt: string;
  status: "past" | "current" | "future";
};

type CampaignEvent = {
  id: string;
  type: string;
  title: string;
  description: string;
  scheduledDay?: number;
  scheduledPhase?: string;
  triggeredAt?: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  targetProgress: number;
};

export function SeasonTimeline({ seasonId }: { seasonId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [campaignEvents, setCampaignEvents] = useState<CampaignEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchTimeline = async () => {
    try {
      const [timelineRes, eventsRes, projectsRes] = await Promise.all([
        fetch(`/api/season/timeline?seasonId=${seasonId}`),
        fetch(`/api/campaign/events?seasonId=${seasonId}&status=all`),
        fetch(`/api/projects?seasonId=${seasonId}`),
      ]);

      if (timelineRes.ok) {
        const data = await timelineRes.json();
        setEvents(data.events || []);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setCampaignEvents(data.events || []);
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to load timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();

    // Set up Supabase Realtime subscriptions for campaign data
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`season:${seasonId}:campaign`)
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
                fetch(`/api/campaign/events?seasonId=${seasonId}&status=all`)
                  .then((res) => res.json())
                  .then((data) => setCampaignEvents(data.events || []))
                  .catch(console.error);
              }, 500);
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
            filter: `season_id=eq.${seasonId}`,
          },
          () => {
            // Debounce rapid updates
            setDebounceTimer((prevTimer) => {
              if (prevTimer) {
                clearTimeout(prevTimer);
              }
              return setTimeout(() => {
                fetch(`/api/projects?seasonId=${seasonId}`)
                  .then((res) => res.json())
                  .then((data) => setProjects(data.projects || []))
                  .catch(console.error);
              }, 500);
            });
          }
        )
        .subscribe();

      return () => {
        try {
          setDebounceTimer((prevTimer) => {
            if (prevTimer) {
              clearTimeout(prevTimer);
            }
            return null;
          });
          supabase.removeChannel(channel);
        } catch {
          // Ignore cleanup errors
        }
      };
    } catch (error) {
      // Silently fail if Supabase not configured
      console.error("Failed to set up campaign realtime subscription:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="space-y-4">
      {/* Phase Timeline */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">Phases</h3>
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

      {/* Campaign Events */}
      {campaignEvents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">Campaign Events</h3>
          {campaignEvents.map((event) => (
            <div
              key={event.id}
              className={`flex items-center gap-4 p-3 rounded-lg border bg-purple-900/20 border-purple-700 hover:border-purple-600 ${
                event.triggeredAt ? "opacity-60" : ""
              }`}
            >
              <div className="text-xl">
                {event.type === "storm" && "⛈️"}
                {event.type === "supply_drop" && "📦"}
                {event.type === "wildlife_encounter" && "🐍"}
                {event.type === "tribe_swap" && "🔄"}
                {event.type === "exile_island" && "🏝️"}
                {event.type === "reward_challenge" && "🎁"}
                {event.type === "immunity_idol_clue" && "💎"}
                {event.type === "social_twist" && "🎭"}
                {event.type === "resource_discovery" && "💎"}
                {!["storm", "supply_drop", "wildlife_encounter", "tribe_swap", "exile_island", "reward_challenge", "immunity_idol_clue", "social_twist", "resource_discovery"].includes(event.type) && "✨"}
              </div>
              <div className="flex-1">
                <div className="font-bold text-purple-100">{event.title}</div>
                <div className="text-xs text-stone-400">{event.description}</div>
                {event.scheduledDay && (
                  <div className="text-xs text-stone-500 mt-1">
                    Scheduled: Day {event.scheduledDay} {event.scheduledPhase && `· ${event.scheduledPhase}`}
                  </div>
                )}
              </div>
              {event.triggeredAt && (
                <div className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded">
                  Triggered
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active Projects */}
      {projects.filter((p) => p.status === "active").length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">Active Projects</h3>
          {projects
            .filter((p) => p.status === "active")
            .map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700 hover:border-blue-600"
              >
                <div className="text-xl">🔨</div>
                <div className="flex-1">
                  <div className="font-bold text-blue-100">{project.name}</div>
                  <div className="text-xs text-stone-400">{project.description}</div>
                  <div className="mt-2 w-full bg-stone-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(project.progress / project.targetProgress) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    {project.progress} / {project.targetProgress}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
