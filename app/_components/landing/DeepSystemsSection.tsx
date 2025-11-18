import { TextReveal } from "../TextReveal";

export function DeepSystemsSection() {
    return (
        <div className="mb-24 border-t border-amber-900/30 pt-20">
            <div className="text-center mb-20">
                <h2 className="text-4xl font-adventure text-amber-200 uppercase mb-4 torch-glow">Deep Systems</h2>
                <p className="text-lg text-amber-300/80 max-w-3xl mx-auto">
                    Castaway Council isn&apos;t just voting and challenges. It&apos;s a complete survival ecosystem with crafting, trading, projects, and narrative progression.
                </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 max-w-7xl mx-auto">
                <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer flex flex-col h-full">
                    <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 text-center">🔨</div>
                    <h3 className="text-lg font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors text-center">Crafting System</h3>
                    <p className="text-sm text-amber-200/70 leading-relaxed flex-grow text-center">
                        Discover recipes as you explore. Craft tools, weapons, and survival gear from gathered resources. Each item gives strategic advantages.
                    </p>
                </div>

                <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer flex flex-col h-full">
                    <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 text-center">🤝</div>
                    <h3 className="text-lg font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors text-center">Trade Economy</h3>
                    <p className="text-sm text-amber-200/70 leading-relaxed flex-grow text-center">
                        Negotiate resource trades with players and tribes. Build trust through fair deals. Hoard resources or share strategically.
                    </p>
                </div>

                <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer flex flex-col h-full">
                    <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 text-center">🏗️</div>
                    <h3 className="text-lg font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors text-center">Tribe Projects</h3>
                    <p className="text-sm text-amber-200/70 leading-relaxed flex-grow text-center">
                        Work together to build camp improvements. Contribute resources and progress. Completed projects unlock powerful bonuses for your tribe.
                    </p>
                </div>

                <div className="wood-panel rounded-lg p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-500 hover:shadow-xl hover:shadow-amber-900/40 hover:scale-105 group cursor-pointer flex flex-col h-full">
                    <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 text-center">📖</div>
                    <h3 className="text-lg font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors text-center">Narrative Arcs</h3>
                    <p className="text-sm text-amber-200/70 leading-relaxed flex-grow text-center">
                        Your actions build your character&apos;s story. Track your progression through milestones. Become the hero, villain, or wildcard.
                    </p>
                </div>
            </div>

            <div className="wood-panel rounded-lg p-10 max-w-5xl mx-auto border-2 border-amber-700/40 hover:border-orange-500 transition-all duration-500">
                <h3 className="text-2xl font-tribal text-amber-100 font-bold mb-8 text-center">Resource Management</h3>
                <div className="grid md:grid-cols-3 gap-8 text-sm">
                    <div className="text-center">
                        <h4 className="text-orange-400 font-bold mb-3 uppercase text-base">Food & Water</h4>
                        <p className="text-amber-200/70">Forage, fish, or trade for sustenance. Low hunger/thirst reduces your effectiveness in challenges.</p>
                    </div>
                    <div className="text-center">
                        <h4 className="text-orange-400 font-bold mb-3 uppercase text-base">Materials</h4>
                        <p className="text-amber-200/70">Wood, stone, and fibers for crafting and building. Essential for camp improvements and tools.</p>
                    </div>
                    <div className="text-center">
                        <h4 className="text-orange-400 font-bold mb-3 uppercase text-base">Energy</h4>
                        <p className="text-amber-200/70">Rest to recover. High energy improves challenge performance. Manage it wisely—every action costs energy.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
