"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatedCounter } from "./_components/AnimatedCounter";
import { FAQAccordion } from "./_components/FAQAccordion";
import { useSeason } from "./_components/SeasonContext";
import { createClient } from "./_lib/supabase/client";

interface Season {
  id: string;
  name: string;
  status: "planned" | "active" | "complete";
  dayIndex: number;
}

interface PublicStats {
  activePlayers: number;
  totalSeasons: number;
  totalVotes: number;
  messagesToday: number;
}

interface SeasonWinner {
  seasonId: string;
  seasonName: string;
  winnerDisplayName: string;
  tribeName: string | null;
}

interface PlayerApplicationSummary {
  status: "shortlist" | "not_considered";
  wordScore: number;
  updatedAt: string;
}

export default function Home() {
  const { currentSeason, currentPlayer } = useSeason();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [winners, setWinners] = useState<SeasonWinner[]>([]);
  const [applicationSummary, setApplicationSummary] = useState<PlayerApplicationSummary | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let authResult: { email?: string } | null = null;

      try {
        try {
          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();
          authResult = session?.user ?? null;
        } catch (error) {
          console.error("Auth check failed:", error);
        }

        const seasonsPromise = fetch("/api/season/list")
          .then((r) => (r.ok ? r.json() : { seasons: [] }))
          .then((data) => data.seasons || [])
          .catch((error) => {
            console.error("Failed to load seasons:", error);
            return [];
          });

        const statsPromise = fetch("/api/stats/public")
          .then((r) => (r.ok ? r.json() : null))
          .catch((error) => {
            console.error("Failed to load public stats:", error);
            return null;
          });

        const winnersPromise = fetch("/api/stats/winners")
          .then((r) => (r.ok ? r.json() : { winners: [] }))
          .then((data) => data.winners || [])
          .catch((error) => {
            console.error("Failed to load winners:", error);
            return [];
          });

        const applicationPromise: Promise<PlayerApplicationSummary | null> = authResult
          ? fetch("/api/applications")
              .then((r) => (r.ok ? r.json() : { application: null }))
              .then((data) =>
                data.application
                  ? {
                      status: data.application.status as PlayerApplicationSummary["status"],
                      wordScore: data.application.wordScore as number,
                      updatedAt: data.application.updatedAt as string,
                    }
                  : null
              )
              .catch((error) => {
                console.error("Failed to load application:", error);
                return null;
              })
          : Promise.resolve(null);

        const [seasonsResult, statsResult, winnersResult, applicationResult] = await Promise.all([
          seasonsPromise,
          statsPromise,
          winnersPromise,
          applicationPromise,
        ]);

        setUser(authResult);
        setSeasons(seasonsResult);
        setPublicStats(statsResult);
        setWinners(winnersResult);
        setApplicationSummary(applicationResult);
      } catch (error) {
        console.error("Failed to load home data:", error);
        setUser(authResult);
        setSeasons([]);
        setPublicStats(null);
        setWinners([]);
        setApplicationSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Memoize filtered seasons to prevent unnecessary re-renders
  const { activeSeasons, plannedSeasons, completedSeasons } = useMemo(
    () => ({
      activeSeasons: seasons.filter((s) => s.status === "active"),
      plannedSeasons: seasons.filter((s) => s.status === "planned"),
      completedSeasons: seasons.filter((s) => s.status === "complete"),
    }),
    [seasons]
  );

  const formatNumber = useCallback((value: number): string => {
    if (value >= 1000 && value < 1000000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  }, []);

  const formatDate = useCallback((value: string): string => {
    try {
      return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return value;
    }
  }, []);

  // Loading skeleton for splash screen
  if (!user && loading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse">
          <div className="h-12 w-96 bg-amber-950/20 rounded mb-4" />
          <div className="h-8 w-64 bg-amber-950/20 rounded mb-2" />
          <div className="h-6 w-80 bg-amber-950/20 rounded mb-8" />
          <div className="flex gap-3 mb-32">
            <div className="h-12 w-40 bg-amber-950/20 rounded" />
            <div className="h-12 w-32 bg-amber-950/20 rounded" />
          </div>
          <div className="h-px bg-amber-900/30 mb-16" />
          <div className="h-8 w-48 bg-amber-950/20 rounded mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-amber-950/20 rounded" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Show splash screen if no user and no loading
  if (!user && !loading) {
    return (
      <main className="min-h-screen relative">
        <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
          {/* Hero */}
          <div className="mb-24 relative">
            <div className="text-center">
              <div className="inline-block mb-4 animate-fade-in">
                <div className="text-xs uppercase tracking-widest text-amber-500/90 font-tribal font-bold animate-pulse">
                  Outwit • Outplay • Outlast
                </div>
              </div>
              <h1 className="text-5xl sm:text-7xl font-adventure mb-6 torch-glow drop-shadow-[0_0_30px_rgba(255,107,53,0.5)] animate-fade-in-up">
                CASTAWAY COUNCIL
              </h1>
              <p className="text-xl sm:text-2xl text-amber-200 max-w-3xl mx-auto mb-3 font-tribal font-bold leading-relaxed animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                A real-time social survival RPG where 18 players compete over 15 days
              </p>
              <p className="text-base sm:text-lg text-amber-300/80 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                Outwit your rivals through strategy. Outlast the competition through skill. Outplay everyone to become the sole survivor.
              </p>
              <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                <Link
                  href="/apply"
                  className="group px-10 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:from-orange-700 active:to-amber-700 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg shadow-orange-900/40 hover:shadow-2xl hover:shadow-orange-900/60 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 focus-visible:outline-none border border-amber-700/30 hover:scale-105 hover:-translate-y-0.5"
                >
                  Apply to Play
                  <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/log"
                  className="group px-10 py-4 wood-panel hover:border-amber-600 rounded-lg font-semibold text-lg transition-all duration-300 text-amber-100 focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 focus-visible:outline-none hover:scale-105 hover:-translate-y-0.5"
                >
                  Watch Past Seasons
                  <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Game Overview */}
          <div className="mb-24 border-t border-amber-900/30 pt-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-adventure text-amber-200 uppercase mb-4 torch-glow">The Game</h2>
              <p className="text-lg text-amber-300/80 max-w-3xl mx-auto font-bold">
                15 days. 18 players. 3 phases per day. Only 1 survivor.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 mb-16">
              <div className="text-center group cursor-default">
                <div className="text-7xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">🏕️</div>
                <h3 className="text-2xl font-tribal text-amber-100 font-bold mb-4 transition-colors group-hover:text-orange-400">Camp Phase</h3>
                <p className="text-amber-200/80 leading-relaxed transition-colors group-hover:text-amber-200">
                  Forage for food, search for hidden immunity idols, build camp improvements, and plot with your alliance. Every action matters.
                </p>
              </div>

              <div className="text-center group cursor-default">
                <div className="text-7xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">⚔️</div>
                <h3 className="text-2xl font-tribal text-amber-100 font-bold mb-4 transition-colors group-hover:text-orange-400">Challenge Phase</h3>
                <p className="text-amber-200/80 leading-relaxed transition-colors group-hover:text-amber-200">
                  Compete in immunity challenges. Winners are safe from elimination. Losers face tribal council. Your archetype abilities activate here.
                </p>
              </div>

              <div className="text-center group cursor-default">
                <div className="text-7xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">🔥</div>
                <h3 className="text-2xl font-tribal text-amber-100 font-bold mb-4 transition-colors group-hover:text-orange-400">Tribal Council</h3>
                <p className="text-amber-200/80 leading-relaxed transition-colors group-hover:text-amber-200">
                  Vote to eliminate one player. Use idols to save yourself. Survive the vote or your torch gets snuffed. The tribe has spoken.
                </p>
              </div>
            </div>

            <div className="wood-panel rounded-lg p-10 max-w-4xl mx-auto border-2 border-amber-700/30 hover:border-amber-600/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/40">
              <div className="text-center">
                <div className="text-6xl mb-6 animate-pulse">👑</div>
                <h3 className="text-3xl font-tribal text-amber-100 font-bold mb-6 torch-glow">Path to Victory</h3>
                <div className="space-y-4 text-left max-w-2xl mx-auto text-amber-200/80 text-base">
                  <p className="hover:text-amber-100 transition-colors pl-4 border-l-2 border-amber-700/50 hover:border-orange-500 hover:pl-6 transition-all duration-300">• <span className="font-bold text-amber-100">Days 1-14:</span> One player eliminated each day. Survive 14 tribal councils.</p>
                  <p className="hover:text-amber-100 transition-colors pl-4 border-l-2 border-amber-700/50 hover:border-orange-500 hover:pl-6 transition-all duration-300">• <span className="font-bold text-amber-100">The Merge:</span> When 11 players remain, tribes merge into one. Jury begins.</p>
                  <p className="hover:text-amber-100 transition-colors pl-4 border-l-2 border-amber-700/50 hover:border-orange-500 hover:pl-6 transition-all duration-300">• <span className="font-bold text-amber-100">Day 15 Finale:</span> Final 4 compete. Winner picks 2 rivals for 1v1 battle. Final 3 face the jury.</p>
                  <p className="hover:text-amber-100 transition-colors pl-4 border-l-2 border-amber-700/50 hover:border-orange-500 hover:pl-6 transition-all duration-300">• <span className="font-bold text-amber-100">The Jury:</span> All eliminated players after merge vote for the winner. Outwit. Outplay. Outlast.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Character Classes Detail */}
          <div className="mb-24 border-t border-amber-900/30 pt-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-adventure text-amber-200 uppercase mb-4 torch-glow">Choose Your Archetype</h2>
              <p className="text-lg text-amber-300/80 max-w-3xl mx-auto">
                Each class has unique abilities that change how you play. Choose wisely—your archetype defines your survival strategy.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {/* Hunter */}
              <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/40 hover:border-orange-500 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-900/50 hover:scale-105 hover:-translate-y-2 cursor-pointer group">
                <div className="text-center mb-4">
                  <span className="text-6xl mb-3 block transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">🪓</span>
                  <h3 className="text-2xl font-tribal text-amber-100 font-bold group-hover:text-orange-400 transition-colors">The Hunter</h3>
                  <p className="text-sm text-amber-600 uppercase tracking-wide group-hover:text-amber-500 transition-colors">Provider / Resource Gatherer</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="text-orange-400 font-bold mb-2 uppercase tracking-wide">Abilities</h4>
                    <ul className="space-y-1 text-amber-200/80">
                      <li>• <span className="font-semibold">Forage Boost:</span> 25% higher chance of finding food/materials</li>
                      <li>• <span className="font-semibold">Track Game:</span> Guarantee 1 food item every 3 days</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-bold mb-2 uppercase tracking-wide">Weakness</h4>
                    <p className="text-amber-200/70">Loses energy faster in challenges due to physical strain</p>
                  </div>
                </div>
              </div>

              {/* Strategist */}
              <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/40 hover:border-purple-500 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-900/50 hover:scale-105 hover:-translate-y-2 cursor-pointer group">
                <div className="text-center mb-4">
                  <span className="text-6xl mb-3 block transition-transform duration-300 group-hover:scale-125">🧠</span>
                  <h3 className="text-2xl font-tribal text-amber-100 font-bold group-hover:text-purple-400 transition-colors">The Strategist</h3>
                  <p className="text-sm text-amber-600 uppercase tracking-wide group-hover:text-amber-500 transition-colors">Mastermind / Social Manipulator</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="text-orange-400 font-bold mb-2 uppercase tracking-wide">Abilities</h4>
                    <ul className="space-y-1 text-amber-200/80">
                      <li>• <span className="font-semibold">Insight:</span> See hints about vote intentions each round</li>
                      <li>• <span className="font-semibold">Predict Outcome:</span> Cancel 1 twist event before merge</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-bold mb-2 uppercase tracking-wide">Weakness</h4>
                    <p className="text-amber-200/70">Gains less comfort from tribe upgrades (seen as detached)</p>
                  </div>
                </div>
              </div>

              {/* Builder */}
              <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/40 hover:border-amber-500 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/50 hover:scale-105 hover:-translate-y-2 cursor-pointer group">
                <div className="text-center mb-4">
                  <span className="text-6xl mb-3 block transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">💪</span>
                  <h3 className="text-2xl font-tribal text-amber-100 font-bold group-hover:text-amber-400 transition-colors">The Builder</h3>
                  <p className="text-sm text-amber-600 uppercase tracking-wide group-hover:text-amber-500 transition-colors">Camp Sustainer / Craftsman</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="text-orange-400 font-bold mb-2 uppercase tracking-wide">Abilities</h4>
                    <ul className="space-y-1 text-amber-200/80">
                      <li>• <span className="font-semibold">Engineer:</span> Shelter and fire last 1 day longer</li>
                      <li>• <span className="font-semibold">Construct Tool:</span> Craft random items every 3 days</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-bold mb-2 uppercase tracking-wide">Weakness</h4>
                    <p className="text-amber-200/70">Weaker in mental challenges</p>
                  </div>
                </div>
              </div>

              {/* Medic */}
              <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/40 hover:border-emerald-500 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-900/50 hover:scale-105 hover:-translate-y-2 cursor-pointer group">
                <div className="text-center mb-4">
                  <span className="text-6xl mb-3 block transition-transform duration-300 group-hover:scale-125">🩹</span>
                  <h3 className="text-2xl font-tribal text-amber-100 font-bold group-hover:text-emerald-400 transition-colors">The Medic</h3>
                  <p className="text-sm text-amber-600 uppercase tracking-wide group-hover:text-amber-500 transition-colors">Caregiver / Morale Booster</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="text-orange-400 font-bold mb-2 uppercase tracking-wide">Abilities</h4>
                    <ul className="space-y-1 text-amber-200/80">
                      <li>• <span className="font-semibold">Tend Wounds:</span> Restore +15% Energy/Comfort to others daily</li>
                      <li>• <span className="font-semibold">Medical Check:</span> 10% reduced evacuation risk</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-bold mb-2 uppercase tracking-wide">Weakness</h4>
                    <p className="text-amber-200/70">Consumes more hunger and thirst daily (focuses on others)</p>
                  </div>
                </div>
              </div>

              {/* Leader */}
              <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/40 hover:border-red-500 transition-all duration-500 hover:shadow-2xl hover:shadow-red-900/50 hover:scale-105 hover:-translate-y-2 cursor-pointer group">
                <div className="text-center mb-4">
                  <span className="text-6xl mb-3 block transition-transform duration-300 group-hover:scale-125 animate-pulse">🔥</span>
                  <h3 className="text-2xl font-tribal text-amber-100 font-bold group-hover:text-red-400 transition-colors">The Leader</h3>
                  <p className="text-sm text-amber-600 uppercase tracking-wide group-hover:text-amber-500 transition-colors">Motivator / Social Powerhouse</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="text-orange-400 font-bold mb-2 uppercase tracking-wide">Abilities</h4>
                    <ul className="space-y-1 text-amber-200/80">
                      <li>• <span className="font-semibold">Inspire Tribe:</span> Increase tribe Energy/Comfort at camp</li>
                      <li>• <span className="font-semibold">Command:</span> Decide tied votes (lose 25% comfort)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-bold mb-2 uppercase tracking-wide">Weakness</h4>
                    <p className="text-amber-200/70">Attracts more suspicion; can&apos;t go idle (social pressure penalty)</p>
                  </div>
                </div>
              </div>

              {/* Scout */}
              <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/40 hover:border-cyan-500 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-900/50 hover:scale-105 hover:-translate-y-2 cursor-pointer group">
                <div className="text-center mb-4">
                  <span className="text-6xl mb-3 block transition-transform duration-300 group-hover:scale-125">🗺️</span>
                  <h3 className="text-2xl font-tribal text-amber-100 font-bold group-hover:text-cyan-400 transition-colors">The Scout</h3>
                  <p className="text-sm text-amber-600 uppercase tracking-wide group-hover:text-amber-500 transition-colors">Observant / Explorer</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="text-orange-400 font-bold mb-2 uppercase tracking-wide">Abilities</h4>
                    <ul className="space-y-1 text-amber-200/80">
                      <li>• <span className="font-semibold">Pathfinder:</span> 10% chance to find hidden advantages</li>
                      <li>• <span className="font-semibold">Spy Mission:</span> View rival tribe chat every 2 days</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-bold mb-2 uppercase tracking-wide">Weakness</h4>
                    <p className="text-amber-200/70">Energy drops faster when exploring (exhaustion risk)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current stats */}
          {publicStats && (
            <div className="mb-24 border-t border-amber-900/30 pt-16">
              <h2 className="text-3xl font-adventure text-amber-200 uppercase mb-12">The Numbers</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-5xl font-tribal font-bold text-amber-100 mb-2">
                    <AnimatedCounter end={publicStats.activePlayers} formatValue={formatNumber} />
                  </div>
                  <div className="text-sm text-amber-600 uppercase tracking-wide font-tribal">Castaways</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-tribal font-bold text-amber-100 mb-2">
                    <AnimatedCounter end={publicStats.totalSeasons} formatValue={formatNumber} />
                  </div>
                  <div className="text-sm text-amber-600 uppercase tracking-wide font-tribal">Seasons</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-tribal font-bold text-amber-100 mb-2">
                    <AnimatedCounter end={publicStats.totalVotes} formatValue={formatNumber} />
                  </div>
                  <div className="text-sm text-amber-600 uppercase tracking-wide font-tribal">Votes Cast</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-tribal font-bold text-amber-100 mb-2">
                    <AnimatedCounter end={publicStats.messagesToday} formatValue={formatNumber} />
                  </div>
                  <div className="text-sm text-amber-600 uppercase tracking-wide font-tribal">Today</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent winners */}
          {winners.length > 0 && (
            <div className="mb-24 border-t border-amber-900/30 pt-16">
              <h2 className="text-3xl font-adventure text-amber-200 uppercase mb-8">Sole Survivors</h2>
              <div className="wood-panel rounded-lg p-6">
                <div className="space-y-4">
                  {winners.map((champ) => (
                    <div key={champ.seasonId} className="flex items-center justify-between py-3 border-b border-amber-900/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">👑</span>
                        <div>
                          <div className="text-amber-100 font-bold text-lg">{champ.winnerDisplayName}</div>
                          {champ.tribeName && (
                            <div className="text-amber-600 text-sm">Tribe: {champ.tribeName}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-amber-700 text-sm font-tribal font-bold">{champ.seasonName}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Why Play */}
          <div className="mb-24 border-t border-amber-900/30 pt-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-adventure text-amber-200 uppercase mb-4 torch-glow">Why Play?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-16">
              <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer">
                <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">🎲</div>
                <h3 className="text-xl font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors">Provably Fair</h3>
                <p className="text-amber-200/80 leading-relaxed">
                  Every challenge uses cryptographic commit-reveal protocol. The server commits to results before you make choices. All RNG is verifiable—no hidden advantages, no cheating possible.
                </p>
              </div>

              <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer">
                <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110">⏱️</div>
                <h3 className="text-xl font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors">Your Own Pace</h3>
                <p className="text-amber-200/80 leading-relaxed">
                  Each phase lasts 6-8 hours. No need to be online constantly. Check in when it works for you. 15 in-game days = 4-5 real weeks. Perfect for busy schedules.
                </p>
              </div>

              <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer">
                <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110">💬</div>
                <h3 className="text-xl font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors">Real Strategy</h3>
                <p className="text-amber-200/80 leading-relaxed">
                  Form secret alliances. Backstab rivals. Bluff about idols. Every tribal council is a social chess match. Your words matter as much as your stats.
                </p>
              </div>

            </div>
          </div>

          {/* FAQ */}
          <div className="mb-20 border-t border-amber-900/30 pt-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-adventure text-amber-200 uppercase mb-4">Common Questions</h2>
            </div>
            <FAQAccordion
              faqs={[
                {
                  q: "Do I need to be online 24/7?",
                  a: "No! Each phase lasts 6-8 hours. Check in once or twice per phase to take actions, chat with your tribe, and vote. Perfect for busy schedules.",
                },
                {
                  q: "How do alliances work?",
                  a: "Use direct messages and tribe chat to form secret alliances. Coordinate votes, share resources, and plan blindsides. Trust is everything—and nothing.",
                },
                {
                  q: "Can I play on my phone?",
                  a: "Yes! It's a Progressive Web App (PWA). Works perfectly on mobile, tablet, and desktop. Install it to your home screen for the best experience.",
                },
                {
                  q: "What happens if I find an immunity idol?",
                  a: "Hidden immunity idols are game-changers. Play one at tribal council to nullify all votes against you. Keep it secret or bluff about having one to manipulate votes.",
                },
                {
                  q: "How many players per season?",
                  a: "18 players divided into 3 tribes of 6. Tribes merge when 11 players remain. Every season is a fresh start with new players and new dynamics.",
                },
              ]}
            />
          </div>

          {/* Final CTA */}
          <div className="border-t border-amber-900/30 pt-20 pb-16">
            <div className="torch-panel rounded-lg p-16 relative overflow-hidden max-w-4xl mx-auto border-2 border-amber-700/40 hover:border-orange-500 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-900/60">
              <div className="relative text-center">
                <div className="text-7xl mb-8 animate-pulse">🔥</div>
                <h3 className="text-5xl sm:text-6xl font-adventure text-amber-100 mb-8 uppercase torch-glow">
                  Your Torch Awaits
                </h3>
                <p className="text-xl sm:text-2xl text-amber-200/90 mb-12 max-w-2xl mx-auto leading-relaxed">
                  Think you can outwit, outplay, and outlast 17 other players? Prove it. New seasons launch regularly—apply now to secure your spot on the beach.
                </p>
                <Link
                  href="/apply"
                  className="group inline-block px-14 py-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-lg font-bold text-2xl transition-all duration-300 shadow-2xl shadow-orange-900/60 hover:shadow-orange-900/80 border-2 border-amber-700/40 hover:border-amber-500 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 focus-visible:outline-none hover:scale-110 hover:-translate-y-1"
                >
                  Apply to Play
                  <span className="inline-block ml-3 transition-transform group-hover:translate-x-2">→</span>
                </Link>
                <p className="text-sm text-amber-500/80 mt-8 font-semibold tracking-wide">
                  Multi-sentence answers land on the shortlist. One-word responses are skipped.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 gradient-text">
            Castaway Council
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Real-time slow-burn social survival RPG where strategy meets survival
          </p>
        </div>

        {currentSeason && currentPlayer && (
        <div className="mb-8 p-8 glass rounded-2xl border border-blue-500/30 card-hover">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back, {currentPlayer.displayName}!</h2>
              <p className="text-white/90">You&apos;re currently playing in <span className="font-semibold text-blue-400">{currentSeason.name}</span></p>
              </div>
              <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-black">
                Active
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tribe"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              >
                Go to Tribe
              </Link>
              <Link
                href="/challenge"
                className="px-6 py-3 glass rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold border border-white/20"
              >
                View Challenge
              </Link>
              <Link
                href="/vote"
                className="px-6 py-3 glass rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold border border-white/20"
              >
                Tribal Council
              </Link>
          </div>
        </div>
      )}

        {user && !loading && (
          <div className="mb-8 p-8 glass rounded-2xl border border-amber-500/30 card-hover">
            {applicationSummary ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-amber-100 mb-2">Your Cast Application</h2>
                    <p className="text-amber-200/80">
                      Updated {formatDate(applicationSummary.updatedAt)} • {applicationSummary.wordScore} words
                    </p>
                  </div>
                  <span
                    className={`px-4 py-1 rounded-full text-sm font-semibold ${
                      applicationSummary.status === "shortlist"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/40"
                        : "bg-amber-500/10 text-amber-200 border border-amber-400/40"
                    }`}
                  >
                    {applicationSummary.status === "shortlist" ? "Shortlist Ready" : "Needs More Detail"}
                  </span>
                </div>
                <p className="text-amber-200/70 mt-4">
                  {applicationSummary.status === "shortlist"
                    ? "Nice work! Long-form answers help casting hear your voice. We’ll reach out when the next season is forming."
                    : "Add more depth to each prompt—applications with single-word answers are automatically moved off the shortlist."}
                </p>
                <div className="mt-6">
                  <Link
                    href="/apply"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-orange-900/40 hover:shadow-orange-900/60"
                  >
                    Update Application
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-amber-100 mb-2">Casting Is Open</h2>
                    <p className="text-amber-200/80">
                      Answer five prompts with detail to land on the shortlist for upcoming seasons.
                    </p>
                  </div>
                  <span className="text-3xl" role="img" aria-label="scroll">
                    📜
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/apply"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-orange-900/40 hover:shadow-orange-900/60"
                  >
                    Start Application
                    <span aria-hidden>→</span>
                  </Link>
                </div>
                <p className="text-sm text-amber-300/70 mt-4">
                  Pro tip: multi-sentence answers stand out. One-word responses are not considered.
                </p>
              </>
            )}
          </div>
        )}

        {!user && (
          <div className="mb-8 p-8 glass rounded-2xl border border-purple-500/30 card-hover">
            <h2 className="text-2xl font-bold mb-2 gradient-text">Get Started</h2>
            <p className="text-white/90 mb-6">
              Sign in or create an account to access the player application and compete for the crown.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/signin"
                className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              >
                Sign In / Sign Up
              </Link>
              <Link
                href="/apply/preview"
                className="inline-flex items-center gap-2 px-8 py-3 glass rounded-lg border border-white/20 hover:bg-white/10 transition-all duration-200 font-semibold"
              >
                Preview Application
                <span aria-hidden>→</span>
              </Link>
            </div>
            <p className="text-sm text-amber-300/70 mt-4">Longer answers keep you on the shortlist—single-word responses are skipped.</p>
          </div>
        )}

        {!loading && seasons.length === 0 && (
          <div className="mb-8 p-8 glass rounded-2xl border border-yellow-500/30">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏝️</span>
              <h2 className="text-2xl font-bold">Welcome to Castaway Council!</h2>
            </div>
            {user ? (
              <>
                <p className="text-white/90 mb-2">You&apos;re signed in as <span className="font-semibold text-amber-400">{user.email}</span></p>
                <p className="text-white/80 mb-4">No seasons are currently active. Seasons are created by admins and will appear here when available.</p>
                <div className="wood-panel rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-bold text-amber-100 mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-amber-200/80">
                    <li>• Seasons are announced via email when they launch</li>
                    <li>• You&apos;ll be able to join and compete with other players</li>
                    <li>• Check back here to see when new seasons are available</li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/log"
                    className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg hover:from-amber-500 hover:to-orange-500 transition-all duration-200 font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50"
                  >
                    Watch Previous Seasons
                  </Link>
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      window.location.reload();
                    }}
                    className="px-6 py-3 glass rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold border border-white/20"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-white/90 mb-4">There are no active seasons right now.</p>
                <p className="text-sm text-white/60">Sign in to get notified when new seasons launch!</p>
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 glass rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {activeSeasons.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                  <h2 className="text-3xl font-bold">Active Seasons</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeSeasons.map((season) => (
                    <Link
                      key={season.id}
                      href={`/season/${season.id}`}
                      className="group p-6 glass rounded-2xl border border-green-500/30 card-hover"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold group-hover:gradient-text transition-all">{season.name}</h3>
                        <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-black">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-white/60 mb-4">Day {season.dayIndex}</p>
                      <div className="flex items-center gap-2 text-sm text-blue-400 font-medium">
                        Join Season
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {plannedSeasons.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" />
                  <h2 className="text-3xl font-bold">Upcoming Seasons</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {plannedSeasons.map((season) => (
                    <div
                      key={season.id}
                      className="p-6 glass rounded-2xl border border-yellow-500/30"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold">{season.name}</h3>
                        <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-black">
                          Planned
                        </span>
                      </div>
                      <p className="text-sm text-white/60">Coming soon</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {completedSeasons.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full" />
                  <h2 className="text-3xl font-bold">Completed Seasons</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {completedSeasons.map((season) => (
                    <div
                      key={season.id}
                      className="p-6 glass rounded-2xl border border-gray-500/30 opacity-60"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold">{season.name}</h3>
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-600 rounded-full">
                          Complete
                        </span>
                      </div>
                      <p className="text-sm text-white/60 mb-2">Day {season.dayIndex}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
