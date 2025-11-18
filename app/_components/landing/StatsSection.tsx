import { AnimatedCounter } from "../AnimatedCounter";

export interface PublicStats {
    activePlayers: number;
    totalSeasons: number;
    totalVotes: number;
    messagesToday: number;
}

interface StatsSectionProps {
    publicStats: PublicStats | null;
    formatNumber: (value: number) => string;
}

export function StatsSection({ publicStats, formatNumber }: StatsSectionProps) {
    if (!publicStats) return null;

    return (
        <div className="mb-24 border-t border-amber-900/30 pt-20">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-adventure text-amber-200 uppercase mb-4 torch-glow">The Numbers</h2>
                <p className="text-lg text-amber-300/80 max-w-3xl mx-auto">
                    Real players. Real seasons. Real strategy.
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                <div className="wood-panel rounded-lg p-6 text-center border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105">
                    <div className="text-5xl font-tribal font-bold text-amber-100 mb-2">
                        <AnimatedCounter end={publicStats.activePlayers} formatValue={formatNumber} />
                    </div>
                    <div className="text-sm text-amber-600 uppercase tracking-wide font-tribal">Castaways</div>
                </div>
                <div className="wood-panel rounded-lg p-6 text-center border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105">
                    <div className="text-5xl font-tribal font-bold text-amber-100 mb-2">
                        <AnimatedCounter end={publicStats.totalSeasons} formatValue={formatNumber} />
                    </div>
                    <div className="text-sm text-amber-600 uppercase tracking-wide font-tribal">Seasons</div>
                </div>
                <div className="wood-panel rounded-lg p-6 text-center border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105">
                    <div className="text-5xl font-tribal font-bold text-amber-100 mb-2">
                        <AnimatedCounter end={publicStats.totalVotes} formatValue={formatNumber} />
                    </div>
                    <div className="text-sm text-amber-600 uppercase tracking-wide font-tribal">Votes Cast</div>
                </div>
                <div className="wood-panel rounded-lg p-6 text-center border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105">
                    <div className="text-5xl font-tribal font-bold text-amber-100 mb-2">
                        <AnimatedCounter end={publicStats.messagesToday} formatValue={formatNumber} />
                    </div>
                    <div className="text-sm text-amber-600 uppercase tracking-wide font-tribal">Today</div>
                </div>
            </div>
        </div>
    );
}
