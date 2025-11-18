import { ScrollReveal, ParallaxSection, StaggerChildren } from "../ScrollReveal";
import { TextReveal } from "../TextReveal";

export function GameOverview() {
    return (
        <ParallaxSection speed={0.3}>
            <div className="mb-24 border-t border-amber-900/30 pt-20 animate-tribal-pattern">
                <ScrollReveal direction="up">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-adventure text-amber-200 uppercase mb-4 torch-glow hover-torch">
                            <TextReveal splitBy="word">The Game</TextReveal>
                        </h2>
                        <p className="text-lg text-amber-300/80 max-w-3xl mx-auto font-bold mb-6">
                            <TextReveal splitBy="word">15 days. 18 players. 3 phases per day. Only 1 survivor.</TextReveal>
                        </p>
                        <p className="text-base text-amber-300/70 max-w-4xl mx-auto leading-relaxed">
                            <TextReveal splitBy="word">
                                Castaway Council combines the strategic depth of Survivor with the persistent world-building of D&D campaigns.
                                Every action you take builds your narrative arc. Every alliance you form shapes the social landscape.
                                Every resource you gather can be traded, crafted, or hoarded. This isn&apos;t just a game—it&apos;s a living, breathing social experiment.
                            </TextReveal>
                        </p>
                    </div>
                </ScrollReveal>

                <StaggerChildren delay={0.15}>
                    <div className="grid md:grid-cols-3 gap-8 mb-20 max-w-6xl mx-auto">
                        <div className="wood-panel rounded-lg p-8 text-center group cursor-default perspective-container flex flex-col h-full border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105">
                            <div className="perspective-item text-7xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 hover-lift">🏕️</div>
                            <h3 className="text-2xl font-tribal text-amber-100 font-bold mb-4 transition-colors group-hover:text-orange-400 hover-torch">Camp Phase</h3>
                            <p className="text-amber-200/80 leading-relaxed transition-colors group-hover:text-amber-200 mb-4 flex-grow">
                                Forage for food, search for hidden immunity idols, build camp improvements, and plot with your alliance. Every action matters.
                            </p>
                            <div className="text-sm text-amber-300/60 space-y-2">
                                <p>• Craft tools from gathered resources</p>
                                <p>• Contribute to tribe projects</p>
                                <p>• Trade resources with allies</p>
                                <p>• Form secret alliances via DM</p>
                                <p>• Build your narrative arc</p>
                            </div>
                        </div>

                        <div className="wood-panel rounded-lg p-8 text-center group cursor-default perspective-container flex flex-col h-full border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105">
                            <div className="perspective-item text-7xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 hover-lift">⚔️</div>
                            <h3 className="text-2xl font-tribal text-amber-100 font-bold mb-4 transition-colors group-hover:text-orange-400 hover-torch">Challenge Phase</h3>
                            <p className="text-amber-200/80 leading-relaxed transition-colors group-hover:text-amber-200 mb-4 flex-grow">
                                Compete in immunity challenges. Winners are safe from elimination. Losers face tribal council. Your archetype abilities activate here.
                            </p>
                            <div className="text-sm text-amber-300/60 space-y-2">
                                <p>• Provably fair commit-reveal RNG</p>
                                <p>• Team and individual challenges</p>
                                <p>• Archetype bonuses apply</p>
                                <p>• Energy and stats affect outcomes</p>
                                <p>• Winners gain immunity</p>
                            </div>
                        </div>

                        <div className="wood-panel rounded-lg p-8 text-center group cursor-default perspective-container flex flex-col h-full border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105">
                            <div className="perspective-item text-7xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 hover-lift">🔥</div>
                            <h3 className="text-2xl font-tribal text-amber-100 font-bold mb-4 transition-colors group-hover:text-orange-400 hover-torch">Tribal Council</h3>
                            <p className="text-amber-200/80 leading-relaxed transition-colors group-hover:text-amber-200 mb-4 flex-grow">
                                Vote to eliminate one player. Use idols to save yourself. Survive the vote or your torch gets snuffed. The tribe has spoken.
                            </p>
                            <div className="text-sm text-amber-300/60 space-y-2">
                                <p>• Secret ballot voting</p>
                                <p>• Play hidden immunity idols</p>
                                <p>• Tie-breaker rules apply</p>
                                <p>• Jury begins after merge</p>
                                <p>• Every vote counts</p>
                            </div>
                        </div>
                    </div>
                </StaggerChildren>

                <ScrollReveal direction="up" delay={0.2}>
                    <div className="wood-panel rounded-lg p-10 max-w-5xl mx-auto border-2 border-amber-700/30 hover:border-amber-600/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/40 hover-lift hover-glow">
                        <div className="text-center">
                            <div className="text-6xl mb-6 animate-pulse">👑</div>
                            <h3 className="text-3xl font-tribal text-amber-100 font-bold mb-8 torch-glow">Path to Victory</h3>
                            <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto text-amber-200/80 text-base">
                                <p className="hover:text-amber-100 transition-colors pl-4 border-l-2 border-amber-700/50 hover:border-orange-500 hover:pl-6 transition-all duration-300">• <span className="font-bold text-amber-100">Days 1-14:</span> One player eliminated each day. Survive 14 tribal councils.</p>
                                <p className="hover:text-amber-100 transition-colors pl-4 border-l-2 border-amber-700/50 hover:border-orange-500 hover:pl-6 transition-all duration-300">• <span className="font-bold text-amber-100">The Merge:</span> When 11 players remain, tribes merge into one. Jury begins.</p>
                                <p className="hover:text-amber-100 transition-colors pl-4 border-l-2 border-amber-700/50 hover:border-orange-500 hover:pl-6 transition-all duration-300">• <span className="font-bold text-amber-100">Day 15 Finale:</span> Final 4 compete. Winner picks 2 rivals for 1v1 battle. Final 3 face the jury.</p>
                                <p className="hover:text-amber-100 transition-colors pl-4 border-l-2 border-amber-700/50 hover:border-orange-500 hover:pl-6 transition-all duration-300">• <span className="font-bold text-amber-100">The Jury:</span> All eliminated players after merge vote for the winner. Outwit. Outplay. Outlast.</p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </ParallaxSection>
    );
}
