export interface SeasonWinner {
    seasonId: string;
    seasonName: string;
    winnerDisplayName: string;
    tribeName: string | null;
}

interface WinnersSectionProps {
    winners: SeasonWinner[];
}

export function WinnersSection({ winners }: WinnersSectionProps) {
    if (winners.length === 0) return null;

    return (
        <div className="mb-24 border-t border-amber-900/30 pt-20">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-adventure text-amber-200 uppercase mb-4 torch-glow">Sole Survivors</h2>
                <p className="text-lg text-amber-300/80 max-w-3xl mx-auto">
                    Champions who outwitted, outplayed, and outlasted the competition
                </p>
            </div>
            <div className="wood-panel rounded-lg p-8 max-w-4xl mx-auto border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500">
                <div className="space-y-4">
                    {winners.map((champ) => (
                        <div key={champ.seasonId} className="flex items-center justify-between py-4 px-4 border-b border-amber-900/30 last:border-0 hover:bg-amber-950/20 transition-colors rounded-lg">
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">👑</span>
                                <div>
                                    <div className="text-amber-100 font-bold text-lg">{champ.winnerDisplayName}</div>
                                    {champ.tribeName && (
                                        <div className="text-amber-600 text-sm">Tribe: {champ.tribeName}</div>
                                    )}
                                </div>
                            </div>
                            <div className="text-amber-700 text-base font-tribal font-bold">{champ.seasonName}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
