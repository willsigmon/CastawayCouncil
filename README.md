# Castaway Council

A real-time, slow-burn social survival RPG where every day counts. Compete in challenges, manage resources, form alliances, and survive tribal councils to become the ultimate castaway.

## Architecture

**Stack:**
- Frontend: Next.js 14 (App Router) PWA
- Backend: Next.js Route Handlers
- Database: PostgreSQL with Drizzle ORM
- Orchestration: Temporal Workflows
- Real-time: Supabase Realtime
- Push: Web Push API (VAPID)
- Language: TypeScript end-to-end

## Game Loop

1 real day = 1 in-game day

**Daily Phases:**
1. **Camp Phase** (8 hours) - Forage, gather water, rest, socialize
2. **Challenge Phase** (8 hours) - Compete for immunity (team or individual)
3. **Tribal Council** (6 hours) - Vote to eliminate a player

**Progression:**
- Start with 18 players divided into 3 tribes
- Daily elimination until 10 players remain
- **Merge** at 10 players - individual challenges begin
- Continue to Final 3
- Eliminated players (post-merge) form the **Jury**
- Jury votes for the winner

## Project Structure

```
/app
  /api/*                      # Next.js Route Handlers
  /(season)/*                 # Client routes
  /_components/*              # UI components
  /_lib/*                     # Shared client lib
  /_server/*                  # Server-only helpers
/infra
  docker-compose.yml          # Full stack orchestration
  /temporal                   # Workflows and activities
/drizzle
  schema.ts                   # Database schema
  db.ts                       # Database client
/packages
  /game-logic                 # RNG, scoring, voting logic
  /schemas                    # Zod validation schemas
/scripts
  seed.ts                     # Database seeding
  migrate.ts                  # Run migrations
  fast-forward-season.ts      # Fast-forward mode for testing
```

## Setup

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker and Docker Compose

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Generate VAPID keys for Web Push
node -e "console.log(JSON.stringify(require('web-push').generateVAPIDKeys()))"
# Add keys to .env

# Start infrastructure (Postgres, Temporal, Supabase)
cd infra
docker compose up -d

# Run migrations
pnpm db:generate
pnpm db:migrate

# Seed database with test season
pnpm db:seed
```

### Development

```bash
# Start Next.js dev server
pnpm dev

# In another terminal, start Temporal worker
pnpm temporal:worker

# Access the app
open http://localhost:3000

# Temporal UI
open http://localhost:8080

# Supabase Studio
open http://localhost:54323
```

## Database Schema

Key tables:
- `users` - User accounts
- `seasons` - Game seasons
- `players` - Players in a season
- `tribes` - Tribe assignments
- `stats` - Daily player stats (energy, hunger, thirst, social)
- `items` - Idols, tools, and event items
- `messages` - Tribe chat, DMs, public log
- `confessionals` - Private player diaries
- `challenges` - Challenge data with commit-reveal seeds
- `votes` - Tribal council votes
- `events` - Event sourcing for phase transitions

## API Endpoints

**Tasks:**
- `POST /api/task/forage` - Gather food
- `POST /api/task/water` - Gather water
- `POST /api/task/rest` - Restore energy
- `POST /api/task/help` - Help another player (social)

**Challenge:**
- `POST /api/challenge/commit` - Commit seed before challenge

**Voting:**
- `POST /api/vote` - Cast or change vote
- `POST /api/item/play-idol` - Play immunity idol

**Social:**
- `POST /api/confessional` - Write confessional

**Push:**
- `POST /api/push/subscribe` - Subscribe to notifications

## Game Logic

### Commit-Reveal RNG

Fair, verifiable random number generation:

1. Client generates `clientSeed` and commits `SHA256(clientSeed)`
2. Server stores `serverSeed` (secret until scoring)
3. At scoring time: `roll = HMAC_SHA256(serverSeed, clientSeed || encounterId || subjectId) % 20 + 1`
4. Server publishes both seeds for verification

### Challenge Scoring

```
total = D20_roll
      + floor(energy / 20)     // 0-5 bonus
      + itemBonus               // From tools
      - debuffs                 // Tainted water, exhaustion
      (minimum 1)
```

Team challenges: Sum of top K player rolls

### Voting & Elimination

- Players vote for one target
- Votes can be changed until phase ends
- Immunity idol negates votes
- Most votes → eliminated
- Tie → revote or fire-making challenge

## Testing

```bash
# Unit tests (game logic)
pnpm test

# Fast-forward mode (1 min = 1 day)
FAST_FORWARD_MODE=true pnpm fast-forward

# E2E tests with 18 bot players
pnpm test:e2e
```

## Deployment

The application is containerized and can be deployed with:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Services:
- `web` - Next.js application (port 3000)
- `temporal-worker` - Temporal workflow worker
- `temporal` - Temporal server
- `postgres` - PostgreSQL database
- `supabase-*` - Supabase local stack

## Development Notes

### Fast-Forward Mode

For development and testing, set `FAST_FORWARD_MODE=true`:
- 1 minute = 1 hour
- Full day cycle = ~22 minutes
- Complete 12-day season = ~4.5 hours

### Idempotency

All phase transitions and DB writes are idempotent via:
- Event sourcing in `events` table
- Unique constraints on votes, stats per day
- Temporal workflow durability

### RLS Policies

Row-Level Security enforces:
- Tribe chat visible only to tribe members
- DMs visible only to participants
- Votes hidden until `revealed_at` is set
- Private confessionals visible only to owner

## Architecture Decisions

1. **Temporal for Orchestration** - Durable timers, crash recovery, observable workflows
2. **Drizzle ORM** - Type-safe, composable queries, great DX
3. **Commit-Reveal RNG** - Prevents cheating, verifiable by anyone
4. **Event Sourcing** - Phase transitions recorded in `events` table for audit trail
5. **PWA** - Installable, offline-capable, mobile-first

## Contributing

This is a demonstration project showing production-grade architecture for a real-time multiplayer game.

## License

MIT
