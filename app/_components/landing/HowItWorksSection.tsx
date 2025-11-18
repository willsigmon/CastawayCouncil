import { ScrollReveal } from "../ScrollReveal";

export function HowItWorksSection() {
    const steps = [
        {
            id: 1,
            title: "Apply & Get Cast",
            desc: "Answer five detailed prompts about your strategy, personality, and goals. Multi-sentence answers land on the shortlist.",
            sub: "Applications are reviewed before each season. You'll be notified via email if you're selected.",
            icon: "📝"
        },
        {
            id: 2,
            title: "Join Your Tribe",
            desc: "On Day 1, you're assigned to one of three tribes. Each tribe starts with 6 players. This is your family for the first phase.",
            sub: "Tribe assignments are random, but your archetype choice affects how you contribute.",
            icon: "🤝"
        },
        {
            id: 3,
            title: "Survive Daily Phases",
            desc: "Camp (8h), Challenge (8h), and Tribal Council (8h). Forage, compete for immunity, and vote someone out.",
            sub: "You don't need to be online for the full phase—just check in to take actions and vote.",
            icon: "⚔️"
        },
        {
            id: 4,
            title: "Merge & Face the Jury",
            desc: "When 11 players remain, tribes merge. The jury begins—every eliminated player votes for the winner.",
            sub: "Social game becomes critical. Every vote-out creates a potential jury member.",
            icon: "⚖️"
        },
        {
            id: 5,
            title: "Win Final Tribal",
            desc: "Final 4 compete. Winner picks 2 rivals. Final 3 face the jury. Make your case and claim the title.",
            sub: "Your entire game is on display. Make it count.",
            icon: "👑"
        }
    ];

    return (
        <div className="mb-24 border-t border-amber-900/30 pt-20 relative overflow-hidden">
            <div className="text-center mb-20 relative z-10">
                <h2 className="text-5xl font-adventure text-amber-200 uppercase mb-4 torch-glow">Your Journey</h2>
                <p className="text-xl text-amber-300/80 max-w-3xl mx-auto">
                    From applicant to Sole Survivor—the path is treacherous.
                </p>
            </div>

            <div className="max-w-5xl mx-auto relative z-10 px-4">
                {/* Connecting Line */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-amber-700/50 to-transparent hidden md:block" />

                <div className="space-y-12">
                    {steps.map((step, index) => (
                        <ScrollReveal key={step.id} direction={index % 2 === 0 ? "left" : "right"} delay={index * 0.1}>
                            <div className={`flex flex-col md:flex-row gap-8 items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                {/* Content Side */}
                                <div className="flex-1 w-full">
                                    <div className="wood-panel rounded-xl p-8 border-2 border-amber-700/30 hover:border-amber-500 transition-all duration-300 hover:shadow-xl hover:shadow-amber-900/40 group relative">
                                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-950 border-2 border-amber-600 rounded-full flex items-center justify-center text-xl font-bold text-amber-100 shadow-lg z-20">
                                            {step.id}
                                        </div>
                                        <h3 className="text-2xl font-tribal text-amber-100 font-bold mb-3 group-hover:text-orange-400 transition-colors">{step.title}</h3>
                                        <p className="text-amber-200/80 leading-relaxed mb-4">{step.desc}</p>
                                        <p className="text-sm text-amber-500/60 italic border-t border-amber-900/50 pt-3">{step.sub}</p>
                                    </div>
                                </div>

                                {/* Icon/Marker Center */}
                                <div className="relative flex-shrink-0 z-10">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 border-4 border-amber-900 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center text-3xl animate-pulse">
                                        {step.icon}
                                    </div>
                                </div>

                                {/* Empty Side for Balance */}
                                <div className="flex-1 hidden md:block" />
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </div>
    );
}
