"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/app/_lib/supabase/client";
import { CreateEventModal } from "@/app/_components/CreateEventModal";
import { CreateProjectModal } from "@/app/_components/CreateProjectModal";
import { RevealManager } from "@/app/_components/RevealManager";

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

type Reveal = {
  id: string;
  type: string;
  title: string;
  status: string;
  scheduledDay?: number;
};

export default function GMPage() {
  const params = useParams();
  const seasonId = params.seasonId as string;
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"events" | "projects" | "reveals" | "analytics">("events");
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      const [eventsRes, projectsRes, revealsRes] = await Promise.all([
        fetch(`/api/campaign/events?seasonId=${seasonId}&status=all`),
        fetch(`/api/projects?seasonId=${seasonId}`),
        fetch(`/api/reveal?seasonId=${seasonId}`),
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }

      if (revealsRes.ok) {
        const data = await revealsRes.json();
        setReveals(data.reveals || []);
      }
    } catch (error) {
      console.error("Failed to load GM data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up Supabase Realtime subscriptions for GM console
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`gm:${seasonId}`)
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
                  .then((data) => setEvents(data.events || []))
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
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reveals",
            filter: `season_id=eq.${seasonId}`,
          },
          () => {
            // Debounce rapid updates
            setDebounceTimer((prevTimer) => {
              if (prevTimer) {
                clearTimeout(prevTimer);
              }
              return setTimeout(() => {
                fetch(`/api/reveal?seasonId=${seasonId}`)
                  .then((res) => res.json())
                  .then((data) => setReveals(data.reveals || []))
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
      console.error("Failed to set up GM realtime subscription:", error);
    }
  }, [seasonId]);

  const handleTriggerEvent = async (eventId: string) => {
    try {
      const res = await fetch("/api/campaign/events/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        // Refresh events
        const data = await res.json();
        setEvents((prev) => prev.map((e) => (e.id === eventId ? data.event : e)));
      }
    } catch (error) {
      console.error("Failed to trigger event:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-8 bg-stone-800 rounded w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-stone-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-amber-100">GM Console</h1>
        {activeTab === "events" && (
          <button
            onClick={() => setShowCreateEventModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-colors"
          >
            + Create Event
          </button>
        )}
        {activeTab === "projects" && (
          <button
            onClick={() => setShowCreateProjectModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
          >
            + Create Project
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-stone-700">
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "events"
              ? "text-amber-400 border-b-2 border-amber-400"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          Campaign Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "projects"
              ? "text-amber-400 border-b-2 border-amber-400"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("reveals")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "reveals"
              ? "text-amber-400 border-b-2 border-amber-400"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          Reveals ({reveals.length})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "analytics"
              ? "text-amber-400 border-b-2 border-amber-400"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === "events" && (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`p-4 rounded-lg border ${
                event.triggeredAt
                  ? "bg-stone-800/30 border-stone-700 opacity-60"
                  : "bg-purple-900/20 border-purple-700 hover:border-purple-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">
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
                    </span>
                    <h3 className="font-bold text-purple-100">{event.title}</h3>
                    {event.triggeredAt && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded">
                        Triggered
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-400 mb-2">{event.description}</p>
                  {event.scheduledDay && (
                    <p className="text-xs text-stone-500">
                      Scheduled: Day {event.scheduledDay} {event.scheduledPhase && `· ${event.scheduledPhase}`}
                    </p>
                  )}
                </div>
                {!event.triggeredAt && (
                  <button
                    onClick={() => handleTriggerEvent(event.id)}
                    className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-colors"
                  >
                    Trigger Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-4 rounded-lg border bg-blue-900/20 border-blue-700 hover:border-blue-600"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🔨</span>
                    <h3 className="font-bold text-blue-100">{project.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded ${
                        project.status === "active"
                          ? "bg-blue-500/20 text-blue-300"
                          : project.status === "completed"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-stone-500/20 text-stone-300"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-stone-400 mb-3">{project.description}</p>
                  <div className="w-full bg-stone-800 rounded-full h-3 mb-1">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${(project.progress / project.targetProgress) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-500">
                    {project.progress} / {project.targetProgress}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reveals Tab */}
      {activeTab === "reveals" && <RevealManager seasonId={seasonId} />}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div>
          <iframe
            src={`/season/${seasonId}/gm/analytics`}
            className="w-full h-screen border-0"
            title="GM Analytics"
          />
        </div>
      )}

      <CreateEventModal
        seasonId={seasonId}
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onSuccess={() => {
          fetchData();
          setShowCreateEventModal(false);
        }}
      />
      <CreateProjectModal
        seasonId={seasonId}
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onSuccess={() => {
          fetchData();
          setShowCreateProjectModal(false);
        }}
      />
    </div>
  );
}
