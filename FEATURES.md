# Castaway Council - Complete Feature List

## 🎮 Core Game Mechanics

### Player System (18 Players, 15 Days)
- **18 players** across 3 tribes (6 per tribe)
- **15-day season** with merge at 12 players
- **6 character classes** with unique abilities
- **Hunger/Thirst/Comfort/Energy stat system**
- **Medical evacuation** when total stats ≤ 50

### Character Classes
1. **Athlete** 💪 - +5% physical challenge bonus
2. **Strategist** 🧠 - Hints in puzzles, -10% vote visibility
3. **Survivalist** 🏕️ - Stats decay 15% slower, +10% find/fish success
4. **Opportunist** 💰 - +15% advantage find rate
5. **Diplomat** 🤝 - +15% trust gain, +10% alliance strength
6. **Wildcard** 🎲 - Random daily ability from other classes

### Stats System
- **Hunger** (0-100): Depletes faster, restored by food
- **Thirst** (0-100): Critical for survival, restored by water
- **Comfort** (0-100): Affected by weather and shelter
- **Energy** (0-100): Auto-calculated as average of H/T/C

Daily Decay:
- Hunger: -15 (survivalist: -12.75)
- Thirst: -20 (survivalist: -17)
- Comfort: -10 (survivalist: -8.5)

## ⛈️ Weather System

### Weather Types
- **Sunny** ☀️ - Great for gathering, +thirst required
- **Rain** 🌧️ - Free water, -comfort
- **Heat** 🌡️ - Dangerous dehydration, -hunger/-thirst
- **Storm** ⛈️ - Extreme comfort penalty, risk to supplies
- **Cold** ❄️ - -hunger/-comfort, fire essential

### Severity Levels
1. **Mild** - Minor stat impacts
2. **Moderate** - Noticeable effects
3. **Severe** - Extreme penalties with warnings

### Weather Progression
- Days 1-5: 50% sunny, mild weather
- Days 6-10: Balanced weather patterns
- Days 11-15: 25% sunny, more extreme weather

### Camp Protection
- **Shelter** reduces rain/storm comfort penalties by 50%
- **Fire** reduces cold/heat effects by 50%

## 🏗️ Camp Upgrades (6 Types)

### 1. Shelter (Levels 1-3)
- **Cost**: 5/10/15 firewood + coconuts
- **Benefits**: +10/20/30 comfort, 25%/50%/75% weather protection

### 2. Fire Pit (Levels 1-3)
- **Cost**: 3/8/15 firewood
- **Benefits**: +5/10/15 comfort & hunger, cold protection

### 3. Fishing Trap (Levels 1-2)
- **Cost**: Firewood + coconuts
- **Benefits**: +20%/40% fishing success

### 4. Tool Station (Levels 1-2)
- **Cost**: Firewood + coconuts
- **Benefits**: Unlocks crafting, +10%/20% gathering, +5%/10% find rate

### 5. Water Filter (Levels 1-2)
- **Cost**: Firewood + coconuts
- **Benefits**: +10/20 thirst bonus (clean water)

### 6. Storage (Levels 1-3)
- **Cost**: Firewood + coconuts + fish
- **Benefits**: +20/40/60 inventory slots

## 🔨 Crafting System (10 Recipes)

Requires: **Tool Station Level 1 or 2**

### Level 1 Recipes
1. **Fishing Rod** 🎣 - +25% fishing (stick×2 + vine×3)
2. **Improved Spear** 🔱 - +35% fishing (spear + stone×2 + vine)
3. **Water Container** 🏺 - +10 thirst (coconut×2 + vine×2)
4. **Shelter Mat** 🛏️ - +15 comfort (palm_frond×5 + vine×3)
5. **Fire Starter** 🔥 - Reliable fire (stick×3 + dry_grass×5 + stone)
6. **Coconut Oil** 🥥 - Cooking ingredient (coconut×4 + firewood×2)

### Level 2 Recipes
7. **Fishing Net** 🕸️ - +50% fishing (vine×10 + stick×4) [30min]
8. **Rain Collector** ☔ - Auto water collection (coconut×3 + palm_frond×4 + vine×2) [20min]
9. **Signal Fire** 🔥 - Attract help (firewood×10 + palm_frond×5 + coconut_oil×2) [15min]
10. **Advanced Shelter** 🏠 - +25 comfort (firewood×8 + palm_frond×10 + vine×6 + stone×4) [45min]

## 🎯 Camp Actions (9 Actions)

### Gathering (Adds to Tribe Inventory)
1. **Collect Firewood** 🪵 - -10 energy
2. **Gather Coconuts** 🥥 - -10 energy
3. **Spear Fish** 🐟 - Requires spear, 40% success (+10% survivalist)

### Improvement (Consume Resources)
4. **Build Shelter** 🏠 - Requires 3 firewood, +comfort
5. **Get Water** 💧 - +thirst
6. **Cook Food** 🍲 - Requires firewood + food, +hunger

### Recovery
7. **Rest** 😴 - +comfort, +energy
8. **Meditate** 🧘 - +energy (requires good stats)

### Strategic
9. **Search for Advantages** 🔍 - 33% find rate (+10% survivalist)

## 🏆 Advantages System

### Types
- **Immunity** 🛡️ - Negates all votes at tribal council
- **Vote Steal** 🎯 - Steal and use someone's vote
- **Extra Vote** ➕ - Cast two votes

### Mechanics
- **2 advantages per camp** (6 total across 3 tribes)
- **33% base find rate** (+10% for survivalists, +15% for opportunists)
- **Advantages respawn** after being played
- **Personal inventory** - only you can see them

## 🎲 Random Events System (7 Types)

### Event Types & Effects

1. **Injury** 🤕 (5% chance)
   - Mild: -10 comfort, -5 energy (1 day)
   - Moderate: -20 comfort, -15 energy, -5 hunger (2 days)
   - Severe: -30 comfort, -25 energy, -10 hunger (3 days, medical risk)

2. **Animal Encounter** 🐗 (8% chance)
   - Mild: Friendly dolphin, +1 fish
   - Moderate: Monkeys steal 2 coconuts
   - Severe: Wild boar scatters supplies (-3 fish, -2 coconuts)

3. **Lost Supplies** 🌊 (4% chance - Tribe)
   - Mild: -2 firewood
   - Moderate: -3 firewood, -2 coconuts
   - Severe: -5 firewood, -3 coconuts, -2 fish

4. **Mysterious Clue** 🗺️ (6% chance)
   - Mild: Cryptic message, +5 comfort
   - Moderate: Map to advantage location, secret mission
   - Severe: Direct advantage find!

5. **Supply Drop** 📦 (3% chance - Tribe)
   - Mild: +3 coconuts, +2 firewood
   - Moderate: +5 coconuts, +4 firewood, +2 fish
   - Severe: Major drop + hidden advantage

6. **Tribal Visit** 🏝️ (2% chance - Tribe)
   - Mild: Fishing tips, +10 comfort, +5 hunger
   - Moderate: Feast invitation, +20 comfort, +10 hunger/thirst, +3 fish
   - Severe: Alliance formed, major gifts, secret mission

7. **Food Spoilage** 🦟 (5% chance - Tribe)
   - Mild: -1 fish
   - Moderate: -2 fish, -1 coconut
   - Severe: -4 fish, -3 coconuts, -10 comfort

### Trigger Probability
- Days 1-5: 15% chance
- Days 6-10: 25% chance
- Days 11-15: 35% chance

## 🎯 Secret Missions System

### Mission Types (8 Types)
1. **Strategic Vote** 🗳️ - Convince tribe to vote specific player
2. **Form Alliance** 🤝 - Build trust through conversations
3. **Resource Gathering** 🌾 - Secretly gather resources
4. **Find Advantage** 🔍 - Find hidden advantage
5. **Build Upgrade** 🏗️ - Lead camp improvement
6. **Help Player** ❤️ - Secretly boost ally's stats
7. **Win Challenge** 🏆 - Top performance in challenge
8. **Avoid Player** 🚶 - Maintain distance from rival

### Rewards
- **Insight Points**: 8-20 points
- **Stat Bonuses**: +10-30 to various stats
- **Advantages**: Hidden advantage grants
- **Immunity**: One-time protection
- **Jury Influence**: +2-5 jury favor

### Mission Mechanics
- **30-50% of players** get missions each day
- **Secret bonus** for keeping missions hidden
- **1-3 day expiration** periods
- **Progress tracking** (0-100%)

## 🤝 Trust Meter & Relationships

### Relationship Metrics
- **Trust Level** (0-100) - Personal trust between players
- **Alliance Strength** (0-100) - Strategic partnership strength

### 10 Interaction Types
1. **Chat Message** +1 trust
2. **Private DM** +2 trust, +1 alliance
3. **Vote Together** +8 trust, +10 alliance
4. **Vote Against** -15 trust, -20 alliance
5. **Help Action** +5 trust, +3 alliance
6. **Share Resource** +6 trust, +4 alliance
7. **Betrayal** -30 trust, -40 alliance
8. **Alliance Formed** +15 trust, +25 alliance
9. **Challenge Cooperation** +7 trust, +8 alliance
10. **Save from Vote** +20 trust, +30 alliance

### Relationship Tiers
- **Enemy** 💔 (<20 combined) - High tension
- **Stranger** ❓ (20-40) - Minimal connection
- **Acquaintance** 👋 (40-60) - Casual relationship
- **Friend** 🤝 (60-75) - Trustworthy ally
- **Close Ally** 💙 (75-90) - Strong bond
- **Final Two** 💜 (90+) - Unbreakable alliance

### Features
- **Alliance stability** calculation with risk assessment
- **Vote pattern prediction** with confidence levels
- **Natural alliance detection**
- **Diminishing returns** for repeated interactions

## 💭 Rumor System

### Rumor Categories (7 Types)
1. **Advantage** 🔍 - "Someone found an advantage"
2. **Alliance** 🤝 - "Secret meeting spotted"
3. **Voting** 🗳️ - "Target for tonight's vote"
4. **Betrayal** 🔪 - "Planning to flip"
5. **Challenge** 🏆 - "Tomorrow's challenge type"
6. **Personal** 👤 - "Player struggling with stats"
7. **Twist** 🌀 - "Major twist coming"

### Rumor Mechanics
- **60% truthful**, 40% false
- **1-3 rumors per day**
- **3 impact levels**: Low, Medium, High
- **Visibility controls**: All, tribe-specific, player-specific
- **1-3 day expiration**
- **Truthfulness hidden** from players (no meta-gaming)

### Impact
- **Trust modifier**: -2 to -10
- **Paranoia level**: 5-20
- **Strategic value**: 3-15

## 🏝️ Challenges

### Tower of Ten (Text-Based)
- **Phase 1: Building** - Tribes pick 1-5 feet, matching = zero
- **Phase 2: Puzzle** - 5-emoji sequence with position feedback
- **Winning**: First to goal or best puzzle solver

### Challenge Performance
- **Performance fatigue**: Low energy/comfort reduces performance
- **Class bonuses**: Athlete +5%, Strategist gets hints

## 🗳️ Voting & Tribal Council

### Voting Mechanics
- **Private votes** until reveal
- **Advantages** can negate or steal votes
- **Re-votes** on ties
- **Medical evac** if stats ≤ 50 total

### Finale (Day 15 or Final 4)
1. Final immunity challenge
2. Winner picks 2 for fire-making
3. Fire-making battle
4. Final 3 face jury
5. Jury votes (9-10 jurors)
6. Winner announced

## 📊 Temporal Workflow Integration

### Daily Flow
1. **Create day stats** - Initialize stats for new day
2. **Apply stat decay** - Daily hunger/thirst/comfort reduction
3. **Generate weather** - Random weather with stat effects
4. **Trigger random event** - 15-35% chance per day
5. **Generate rumors** - 1-3 new rumors
6. **Assign missions** - 30-50% of players
7. **Check medical evacs** - Auto-evacuate if stats ≤ 50
8. **Camp phase** (8 hours) - Actions, chat, strategy
9. **Challenge phase** (8 hours) - Competition
10. **Vote phase** (6 hours) - Tribal council
11. **Tally votes** - Elimination
12. **Check merge** - At 12 players
13. **Daily summary** - Event logging

### Fast-Forward Mode
- 1 minute = 1 hour
- Camp: 8 minutes
- Challenge: 8 minutes
- Vote: 6 minutes
- Full day: ~22 minutes

## 🎨 Frontend Features

### Components
- **WeatherDisplay** - Live weather with stat effects
- **StatsGrid** - All 4 stats with medical alerts
- **ClassBadge** - Player class with ability tooltips
- **TaskActions** - All 9 camp actions organized
- **TrustMeter** - Beautiful relationship visualizations
- **RumorFeed** - Active rumors with visibility
- **SecretMissions** - Mission cards with progress
- **InventoryDisplay** - Personal and tribe inventories
- **ActionLog** - Camp activity feed
- **CampUpgrades** - Build and upgrade interface

### Real-Time Features
- **Supabase Realtime** - Chat and presence
- **Web Push** - Notifications for events
- **Live updates** - Auto-refresh stats and data

## 🔐 Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL with Row-Level Security
- **Workflows**: Temporal for durable orchestration
- **Realtime**: Supabase Realtime
- **Notifications**: Web Push API (VAPID)
- **Game Logic**: TypeScript package with pure functions

## 📈 Stats & Tracking

### Player Stats
- Total games played
- Win rate
- Advantages found
- Alliances formed
- Trust level average
- Challenges won

### Season Stats
- Total events
- Weather patterns
- Random events triggered
- Missions completed
- Rumors generated
- Crafted items

## 🎯 Game Balance

### Resource Economy
- **Firewood**: Most common, essential for fire/shelter
- **Coconuts**: Food source, crafting material
- **Fish**: Protein, requires tools or luck
- **Spears**: Limited, valuable for fishing
- **Advantages**: Rare, game-changing

### Stat Balance
- **Hunger**: Slow drain, manageable
- **Thirst**: Fast drain, critical priority
- **Comfort**: Weather-dependent, upgrade-mitigated
- **Energy**: Derived stat, limits actions

### Class Balance
- **Athlete**: Combat/challenge focused
- **Strategist**: Information advantage
- **Survivalist**: Sustainability focused
- **Opportunist**: High-risk/high-reward
- **Diplomat**: Social game mastery
- **Wildcard**: Adaptable, unpredictable

## 🎬 Confessional Insights System

### Recording Confessionals
- **Private confessionals** - Only visible to you
- **Postseason confessionals** - Revealed after game ends
- **Suggested prompts** - Context-aware questions to inspire confessionals
- **Minimum 10 characters** for recording

### Insight Points
Earn points based on confessional content:
- **Strategy** (3-5 pts) - Alliance discussions, vote plans, game moves
- **Social** (2-4 pts) - Relationship analysis, trust observations
- **Observation** (2-3 pts) - Detailed game observations
- **Prediction** (2-3 pts) - Future game event predictions
- **Self-reflection** (1-2 pts) - Personal thoughts

### Bonuses
- **Length bonus**: +1 pt for 50+ words, +2 pts for 100+ words
- **Player mentions**: +1 pt for 2+ @mentions, +2 pts for 3+ mentions
- **Maximum**: 10 points per confessional

### Rewards
Unlock rewards at milestone thresholds:
- **10 points**: +10 to all stats
- **25 points**: +1 jury influence
- **50 points**: Clue to hidden advantage location
- **100 points**: Extra vote advantage

## 📊 Player Stats & Leaderboard

### Career Stats Tracking
Tracks performance across all seasons:
- **Games played** - Total seasons participated in
- **Wins** - Season victories
- **Final three** - Times reached finale
- **Jury appearances** - Times served on jury
- **Advantages found/played** - Total advantages
- **Challenges won** - Total challenge victories
- **Days played** - Total survival days
- **Votes received/cast** - Voting history
- **Confessionals made** - Total confessional count
- **Total insight points** - Cumulative insight points

### Derived Stats
- **Win rate** - Win percentage across all games
- **Average days played** - Avg survival per game
- **Average challenges per game**
- **Average advantages per game**
- **Final three rate** - Percentage of finale appearances
- **Jury appearance rate** - Percentage of jury appearances

### Leaderboards
Rank players by:
- **Total wins** 🏆
- **Win rate** 📊
- **Challenges won** 💪
- **Advantages found** 🔍
- **Insight points** 🧠
- **Days played** 📅

### Player Tiers
Based on total performance score:
1. **Novice** (<25 pts) - Just getting started
2. **Rookie** (25-99 pts) - Learning the ropes
3. **Competitor** (100-249 pts) - Experienced player
4. **Expert** (250-499 pts) - Solid track record
5. **Master** (500-999 pts) - Highly skilled
6. **Legend** (1000+ pts) - Elite performance

### Achievements
Unlock 10 achievement badges:
- 🏆 **Sole Survivor** - Win your first season
- 🎖️ **Veteran** - Play 5 seasons
- 💪 **Challenge Beast** - Win 20 challenges
- 🔍 **Advantage Hunter** - Find 10 advantages
- 📹 **Storyteller** - Record 50 confessionals
- 🧠 **Insight Master** - Earn 200 insight points
- 🥉 **Finalist** - Reach final three
- ⚖️ **Jury Duty** - Serve on the jury
- 👑 **Dynasty** - Win 3 seasons
- 🏃 **Marathon Runner** - Play 100 total days

## ⚙️ Custom Game Settings

### Basic Settings
- **Total days** (5-30) - Length of season
- **Merge at** (4-20 players) - When tribes merge
- **Fast-forward mode** - 1 minute = 1 hour (for testing)

### Difficulty Settings
- **Stat decay multiplier** (0.5x - 2.0x)
  - 0.5x = Easier (slower decay)
  - 1.0x = Normal
  - 2.0x = Harder (faster decay)
- **Weather intensity** (0.5x - 2.0x)
  - 0.5x = Milder weather
  - 1.0x = Normal
  - 2.0x = More extreme weather
- **Random event frequency** (0x - 2.0x)
  - 0x = No random events
  - 1.0x = Normal
  - 2.0x = More frequent events

### Reward Settings
- **Advantage spawn rate** (0x - 3.0x)
  - 0x = No advantages
  - 1.0x = Normal
  - 3.0x = Many advantages

### Rules
- Settings can only be changed **before season starts**
- Settings are locked once season status is "active"
- Host-only access to settings interface

## 👁️ Spectator Mode

### For Eliminated Players
When eliminated, players become spectators with special privileges:
- **Watch all tribe chats** - See conversations from all tribes
- **View challenge results** - See who won immunity
- **View voting results** - See who got voted out
- **View player stats** - See all player survival stats
- **View game events** - See timeline of major events
- **Cannot interact** - No messages, no votes, no influence

### Jury Members
Eliminated players after merge become jury members:
- All spectator privileges above
- **Vote at finale** - Choose the winner from final three
- **Jury responsibilities** - Evaluate:
  - Strategic gameplay and big moves
  - Social relationships and alliances
  - Challenge performance
  - Player conduct
  - Final tribal council speeches

### Postseason Content
- Access to all confessionals after season ends
- Behind-the-scenes commentary
- Full game timeline and statistics

## 💪 Performance Fatigue

### Challenge Impact
Low energy and comfort reduce challenge performance:
- **Average stat ≥ 70**: No penalty (peak performance)
- **Average stat 50-69**: -5% score (slightly fatigued)
- **Average stat 30-49**: -15% score (fatigued)
- **Average stat < 30**: -30% score (severely fatigued)

### Stat Calculation
Fatigue based on average of energy and comfort:
```
averageStat = (energy + comfort) / 2
```

### Challenge Scoring
Fatigue multiplier applied after all other bonuses:
1. Base roll (1-20)
2. Add energy bonus
3. Add/subtract hunger/thirst penalties
4. Add item bonuses
5. Add event bonuses
6. Apply fatigue multiplier (0.70 - 1.00)
7. Minimum score of 1

### Strategy
- Rest before challenges to maintain stats
- Build shelter and fire for comfort bonuses
- Gather food and water consistently
- Survivalist class has advantage (slower decay)

---

**Version**: 2.0.0
**Last Updated**: November 2025
**Status**: Feature Complete+ ✅

## 🎉 Recent Additions (v2.0.0)

- ✅ Performance Fatigue system for challenges
- ✅ Anonymous Confessional Insights with rewards
- ✅ Player Stats & Leaderboard across seasons
- ✅ Custom Game Settings for hosts
- ✅ Spectator Mode for eliminated players
