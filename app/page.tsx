"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSeason } from "./_components/SeasonContext";
import { createClient } from "./_lib/supabase/client";
import { HeroSection } from "./_components/landing/HeroSection";
import { GameOverview } from "./_components/landing/GameOverview";
import { CharacterClasses } from "./_components/landing/CharacterClasses";
import { StatsSection, PublicStats } from "./_components/landing/StatsSection";
import { WinnersSection, SeasonWinner } from "./_components/landing/WinnersSection";
import { DeepSystemsSection } from "./_components/landing/DeepSystemsSection";
import { WhyPlaySection } from "./_components/landing/WhyPlaySection";
import { HowItWorksSection } from "./_components/landing/HowItWorksSection";
import { FAQSection } from "./_components/landing/FAQSection";

interface Season {
  id: string;
  name: string;
  status: "planned" | "active" | "complete";
  dayIndex: number;
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
          <HeroSection />
          <GameOverview />
          <CharacterClasses />
          <StatsSection publicStats={publicStats} formatNumber={formatNumber} />
          <WinnersSection winners={winners} />
          <DeepSystemsSection />
          <WhyPlaySection />
          <HowItWorksSection />
          <FAQSection />

          {/* Final CTA */}
          <div className="border-t border-amber-900/30 pt-20 pb-20">
            <div className="torch-panel rounded-lg p-16 relative overflow-hidden max-w-5xl mx-auto border-2 border-amber-700/40 hover:border-orange-500 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-900/60">
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
                    className={`px-4 py-1 rounded-full text-sm font-semibold ${applicationSummary.status === "shortlist"
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
