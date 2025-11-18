import { FAQAccordion } from "../FAQAccordion";

export function FAQSection() {
    return (
        <div className="mb-24 border-t border-amber-900/30 pt-20">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-adventure text-amber-200 uppercase mb-4 torch-glow">Common Questions</h2>
            </div>
            <FAQAccordion
                faqs={[
                    {
                        q: "Do I need to be online 24/7?",
                        a: "No! Each phase lasts 6-8 hours. Check in once or twice per phase to take actions, chat with your tribe, and vote. Perfect for busy schedules. You can set up push notifications to know when phases change or when important events happen.",
                    },
                    {
                        q: "How do alliances work?",
                        a: "Use direct messages and tribe chat to form secret alliances. Coordinate votes, share resources, and plan blindsides. Trust is everything—and nothing. You can form multiple alliances, but be careful—players talk, and your reputation matters.",
                    },
                    {
                        q: "Can I play on my phone?",
                        a: "Yes! It's a Progressive Web App (PWA). Works perfectly on mobile, tablet, and desktop. Install it to your home screen for the best experience. Push notifications work on mobile too, so you'll never miss a phase change or important event.",
                    },
                    {
                        q: "What happens if I find an immunity idol?",
                        a: "Hidden immunity idols are game-changers. Play one at tribal council to nullify all votes against you. Keep it secret or bluff about having one to manipulate votes. Idols can be found during camp phase by exploring or completing certain actions.",
                    },
                    {
                        q: "How many players per season?",
                        a: "18 players divided into 3 tribes of 6. Tribes merge when 11 players remain. Every season is a fresh start with new players and new dynamics. Each season typically lasts 4-5 real weeks.",
                    },
                    {
                        q: "What are narrative arcs?",
                        a: "Your actions throughout the game build your character's narrative arc. Track your progression through milestones (25%, 50%, 75%, 100%). Your arc type (hero, villain, wildcard, etc.) evolves based on your choices. This adds depth and storytelling to your game experience.",
                    },
                    {
                        q: "How does crafting work?",
                        a: "Discover recipes as you explore and complete actions. Use resources from your inventory to craft tools, weapons, and survival gear. Each crafted item provides strategic advantages. Recipes can be found through exploration, trading with other players, or completing projects.",
                    },
                    {
                        q: "Can I trade with players from other tribes?",
                        a: "After the merge, yes! Before the merge, you can only trade within your own tribe. Trading builds relationships but also reveals your resource situation—use it strategically. Fair trades build trust; unfair deals create enemies.",
                    },
                    {
                        q: "What happens if I don't vote?",
                        a: "If you don't vote during tribal council, you automatically vote for yourself. Always vote—even if you're safe with an idol, your vote can influence tie-breakers and jury perception.",
                    },
                    {
                        q: "How do I win challenges?",
                        a: "Challenges use provably fair commit-reveal RNG. Your archetype abilities, energy level, and stats affect your performance. Team challenges combine all tribe members' rolls. Individual challenges are based on your personal stats and abilities.",
                    },
                ]}
            />
        </div>
    );
}
