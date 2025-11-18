"use client";

import { useState } from "react";
import { ScrollReveal, ParallaxSection, StaggerChildren } from "../ScrollReveal";
import { TextReveal } from "../TextReveal";

type Archetype = "Hunter" | "Strategist" | "Builder" | "Medic" | "Leader" | "Scout";

export function CharacterClasses() {
    const [activeClass, setActiveClass] = useState<Archetype | null>(null);

    return (
        <ParallaxSection speed={0.2}>
            <div className="mb-24 border-t border-amber-900/30 pt-20 relative">
                {/* Background Texture */}
                <div className="absolute inset-0 bg-[url('/texture-noise.png')] opacity-5 pointer-events-none mix-blend-overlay" />

                <ScrollReveal direction="up">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-adventure text-amber-200 uppercase mb-4 torch-glow hover-torch tracking-wide">
                            <TextReveal splitBy="word">Choose Your Archetype</TextReveal>
                        </h2>
                        <p className="text-xl text-amber-300/80 max-w-3xl mx-auto font-light">
                            Each class has unique abilities that change how you play. <br />
                            <span className="text-amber-100 font-semibold">Choose wisely—your archetype defines your survival strategy.</span>
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
                    <StaggerChildren delay={0.1}>
                        <ClassCard
                            title="The Hunter"
                            icon="🪓"
                            role="Provider / Resource Gatherer"
                            abilities={[
                                { name: "Forage Boost", desc: "25% higher chance of finding food/materials" },
                                { name: "Track Game", desc: "Guarantee 1 food item every 3 days" }
                            ]}
                            weakness="Loses energy faster in challenges due to physical strain"
                            color="orange"
                            isActive={activeClass === "Hunter"}
                            onActivate={() => setActiveClass(activeClass === "Hunter" ? null : "Hunter")}
                        />

                        <ClassCard
                            title="The Strategist"
                            icon="🧠"
                            role="Mastermind / Social Manipulator"
                            abilities={[
                                { name: "Insight", desc: "See hints about vote intentions each round" },
                                { name: "Predict Outcome", desc: "Cancel 1 twist event before merge" }
                            ]}
                            weakness="Gains less comfort from tribe upgrades (seen as detached)"
                            color="purple"
                            isActive={activeClass === "Strategist"}
                            onActivate={() => setActiveClass(activeClass === "Strategist" ? null : "Strategist")}
                        />

                        <ClassCard
                            title="The Builder"
                            icon="💪"
                            role="Camp Sustainer / Craftsman"
                            abilities={[
                                { name: "Engineer", desc: "Shelter and fire last 1 day longer" },
                                { name: "Construct Tool", desc: "Craft random items every 3 days" }
                            ]}
                            weakness="Weaker in mental challenges"
                            color="amber"
                            isActive={activeClass === "Builder"}
                            onActivate={() => setActiveClass(activeClass === "Builder" ? null : "Builder")}
                        />

                        <ClassCard
                            title="The Medic"
                            icon="🩹"
                            role="Caregiver / Morale Booster"
                            abilities={[
                                { name: "Tend Wounds", desc: "Restore +15% Energy/Comfort to others daily" },
                                { name: "Medical Check", desc: "10% reduced evacuation risk" }
                            ]}
                            weakness="Consumes more hunger and thirst daily (focuses on others)"
                            color="emerald"
                            isActive={activeClass === "Medic"}
                            onActivate={() => setActiveClass(activeClass === "Medic" ? null : "Medic")}
                        />

                        <ClassCard
                            title="The Leader"
                            icon="🔥"
                            role="Motivator / Social Powerhouse"
                            abilities={[
                                { name: "Inspire Tribe", desc: "Increase tribe Energy/Comfort at camp" },
                                { name: "Command", desc: "Decide tied votes (lose 25% comfort)" }
                            ]}
                            weakness="Attracts more suspicion; can't go idle (social pressure penalty)"
                            color="red"
                            isActive={activeClass === "Leader"}
                            onActivate={() => setActiveClass(activeClass === "Leader" ? null : "Leader")}
                        />

                        <ClassCard
                            title="The Scout"
                            icon="🗺️"
                            role="Observant / Explorer"
                            abilities={[
                                { name: "Pathfinder", desc: "10% chance to find hidden advantages" },
                                { name: "Spy Mission", desc: "View rival tribe chat every 2 days" }
                            ]}
                            weakness="Energy drops faster when exploring (exhaustion risk)"
                            color="cyan"
                            isActive={activeClass === "Scout"}
                            onActivate={() => setActiveClass(activeClass === "Scout" ? null : "Scout")}
                        />
                    </StaggerChildren>
                </div>
            </div>
        </ParallaxSection>
    );
}

interface ClassCardProps {
    title: string;
    icon: string;
    role: string;
    abilities: { name: string; desc: string }[];
    weakness: string;
    color: "orange" | "purple" | "amber" | "emerald" | "red" | "cyan";
    isActive: boolean;
    onActivate: () => void;
}

function ClassCard({ title, icon, role, abilities, weakness, color, isActive, onActivate }: ClassCardProps) {
    const colorClasses = {
        orange: "hover:border-orange-500 group-hover:text-orange-400",
        purple: "hover:border-purple-500 group-hover:text-purple-400",
        amber: "hover:border-amber-400 group-hover:text-amber-400",
        emerald: "hover:border-emerald-500 group-hover:text-emerald-400",
        red: "hover:border-red-500 group-hover:text-red-400",
        cyan: "hover:border-cyan-500 group-hover:text-cyan-400",
    };

    const shadowClasses = {
        orange: "hover:shadow-orange-900/50",
        purple: "hover:shadow-purple-900/50",
        amber: "hover:shadow-amber-900/50",
        emerald: "hover:shadow-emerald-900/50",
        red: "hover:shadow-red-900/50",
        cyan: "hover:shadow-cyan-900/50",
    };

    return (
        <div
            onClick={onActivate}
            className={`
        wood-panel rounded-xl p-8 border-2 border-amber-700/30 transition-all duration-500 cursor-pointer group flex flex-col h-full relative overflow-hidden
        ${colorClasses[color]}
        ${shadowClasses[color]}
        ${isActive ? 'scale-105 border-opacity-100 shadow-2xl ring-2 ring-offset-2 ring-offset-black ring-' + color + '-500' : 'hover:scale-105 hover:-translate-y-2 hover:shadow-2xl'}
      `}
        >
            {/* Background Glow on Hover/Active */}
            <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isActive ? 'opacity-100' : ''}`} />

            <div className="relative z-10">
                <div className="text-center mb-6">
                    <span className="text-7xl mb-4 block transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 filter drop-shadow-lg">{icon}</span>
                    <h3 className={`text-3xl font-tribal text-amber-100 font-bold transition-colors ${isActive ? 'text-' + color + '-400' : ''}`}>{title}</h3>
                    <p className="text-sm text-amber-500/80 uppercase tracking-widest font-semibold mt-1">{role}</p>
                </div>

                <div className={`space-y-6 text-sm flex-grow transition-all duration-500 ${isActive ? 'opacity-100 max-h-[500px]' : 'opacity-80'}`}>
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                        <h4 className={`font-bold mb-3 uppercase tracking-wide text-${color}-400 flex items-center gap-2`}>
                            <span className="text-lg">✨</span> Abilities
                        </h4>
                        <ul className="space-y-3 text-amber-100/90">
                            {abilities.map((ability, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-amber-500 mt-1">•</span>
                                    <span>
                                        <span className="font-bold text-amber-200">{ability.name}:</span> {ability.desc}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-red-950/20 p-4 rounded-lg border border-red-900/30">
                        <h4 className="text-red-400 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                            <span className="text-lg">⚠️</span> Weakness
                        </h4>
                        <p className="text-red-200/80 italic">{weakness}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
