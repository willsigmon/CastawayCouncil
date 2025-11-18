import Link from "next/link";
import { ScrollReveal } from "../ScrollReveal";
import { TextReveal } from "../TextReveal";
import { TorchFlicker } from "../TorchFlicker";
import { WaterRipple } from "../WaterRipple";

export function HeroSection() {
    return (
        <WaterRipple className="mb-24 relative min-h-[80vh] flex flex-col justify-center items-center">
            {/* Atmospheric Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(255,107,53,0.15)_0%,transparent_60%)] animate-pulse opacity-50" />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
            </div>

            <div className="text-center relative z-10 max-w-5xl px-4">
                <ScrollReveal delay={0}>
                    <div className="inline-block mb-6">
                        <div className="px-4 py-1 rounded-full border border-amber-500/30 bg-amber-950/30 backdrop-blur-sm">
                            <div className="text-xs sm:text-sm uppercase tracking-[0.3em] text-amber-400 font-tribal font-bold animate-torch-flicker">
                                Outwit • Outplay • Outlast
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1} direction="fade">
                    <TorchFlicker intensity={1.2}>
                        <h1 className="text-6xl sm:text-8xl md:text-9xl font-adventure mb-8 torch-glow drop-shadow-[0_0_50px_rgba(255,107,53,0.6)] animate-text-glow tracking-tight">
                            <TextReveal splitBy="word">CASTAWAY COUNCIL</TextReveal>
                        </h1>
                    </TorchFlicker>
                </ScrollReveal>

                <ScrollReveal delay={0.2} direction="up">
                    <p className="text-2xl sm:text-3xl text-amber-100 max-w-3xl mx-auto mb-6 font-tribal font-bold leading-relaxed drop-shadow-lg">
                        <TextReveal splitBy="word">A real-time social survival RPG where 18 players compete over 15 days</TextReveal>
                    </p>
                </ScrollReveal>

                <ScrollReveal delay={0.3} direction="up">
                    <p className="text-lg sm:text-xl text-amber-200/80 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
                        <TextReveal splitBy="word">Outwit your rivals through strategy. Outlast the competition through skill. Outplay everyone to become the sole survivor.</TextReveal>
                    </p>
                </ScrollReveal>

                <ScrollReveal delay={0.4} direction="up">
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link
                            href="/apply"
                            className="group relative px-12 py-5 bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600 rounded-lg font-bold text-xl transition-all duration-300 shadow-[0_0_30px_rgba(234,88,12,0.4)] hover:shadow-[0_0_50px_rgba(234,88,12,0.6)] border border-orange-500/50 hover:scale-105 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
                            <span className="relative z-10 flex items-center gap-3">
                                Apply to Play
                                <span className="text-2xl transition-transform group-hover:translate-x-1">→</span>
                            </span>
                        </Link>
                        <Link
                            href="/log"
                            className="group px-12 py-5 wood-panel hover:border-amber-500 rounded-lg font-semibold text-xl transition-all duration-300 text-amber-100 hover:text-white hover:scale-105"
                        >
                            Watch Past Seasons
                        </Link>
                    </div>
                </ScrollReveal>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                <div className="w-6 h-10 rounded-full border-2 border-amber-500/50 flex justify-center pt-2">
                    <div className="w-1 h-2 bg-amber-500 rounded-full animate-slide-up" />
                </div>
            </div>
        </WaterRipple>
    );
}
