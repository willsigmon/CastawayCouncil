export function WhyPlaySection() {
    return (
        <div className="mb-24 border-t border-amber-900/30 pt-20">
            <div className="text-center mb-20">
                <h2 className="text-4xl font-adventure text-amber-200 uppercase mb-4 torch-glow">Why Play?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer flex flex-col h-full">
                    <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 text-center">🎲</div>
                    <h3 className="text-xl font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors text-center">Provably Fair</h3>
                    <p className="text-amber-200/80 leading-relaxed mb-3 flex-grow text-center">
                        Every challenge uses cryptographic commit-reveal protocol. The server commits to results before you make choices. All RNG is verifiable—no hidden advantages, no cheating possible.
                    </p>
                    <p className="text-sm text-amber-300/60 text-center">
                        You can verify every roll. Every challenge result is transparent. No &quot;trust us&quot;—just math and cryptography.
                    </p>
                </div>

                <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer flex flex-col h-full">
                    <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 text-center">⏱️</div>
                    <h3 className="text-xl font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors text-center">Your Own Pace</h3>
                    <p className="text-amber-200/80 leading-relaxed mb-3 flex-grow text-center">
                        Each phase lasts 6-8 hours. No need to be online constantly. Check in when it works for you. 15 in-game days = 4-5 real weeks. Perfect for busy schedules.
                    </p>
                    <p className="text-sm text-amber-300/60 text-center">
                        Set your notifications. Play during lunch breaks. Vote before bed. The game adapts to your life, not the other way around.
                    </p>
                </div>

                <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer flex flex-col h-full">
                    <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 text-center">💬</div>
                    <h3 className="text-xl font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors text-center">Real Strategy</h3>
                    <p className="text-amber-200/80 leading-relaxed mb-3 flex-grow text-center">
                        Form secret alliances. Backstab rivals. Bluff about idols. Every tribal council is a social chess match. Your words matter as much as your stats.
                    </p>
                    <p className="text-sm text-amber-300/60 text-center">
                        Direct messages, tribe chat, and public confessionals. Every conversation is a potential move in the game.
                    </p>
                </div>

                <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer flex flex-col h-full">
                    <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 text-center">📱</div>
                    <h3 className="text-xl font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors text-center">Progressive Web App</h3>
                    <p className="text-amber-200/80 leading-relaxed mb-3 flex-grow text-center">
                        Works perfectly on mobile, tablet, and desktop. Install to your home screen. Push notifications keep you updated. No app store required.
                    </p>
                    <p className="text-sm text-amber-300/60 text-center">
                        Play on your phone during commutes. Check in from any device. Your progress syncs instantly across platforms.
                    </p>
                </div>
            </div>
        </div>
    );
}
