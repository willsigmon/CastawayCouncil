# New Features - November 8, 2025

## Overview
Added complementary features inspired by D&D and Survivor gameplay mechanics. All features are **additive only**—no changes to core voting, challenge scoring, or phase logic.

---

## 🎮 New Features

### 1. **Player Stats Dashboard**
**Component**: `app/_components/PlayerStatsCard.tsx`
**API**: `/api/stats/player`
**Purpose**: Visual HUD showing season performance metrics

**Metrics Tracked**:
- 🏆 Challenge Wins
- 🔥 Tribals Survived
- 📜 Votes Received
- 💎 Advantages Found
- 🤝 Alliance Count
- 🎥 Confessional Count

**Usage**:
```tsx
import { PlayerStatsCard } from '@/app/_components/PlayerStatsCard';

<PlayerStatsCard playerId={playerId} seasonId={seasonId} />
```

---

### 2. **Alliance Tracker**
**Schema**: `allianceNotes` table
**API**: `/api/alliance/notes`
**Purpose**: Private relationship tracking (no mechanical bonuses)

**Features**:
- Tag players with trust levels: `distrust`, `neutral`, `ally`, `core`
- Add private notes about alliances
- Pin important relationships
- Searchable tags

**Example Request**:
```bash
POST /api/alliance/notes
{
  "seasonId": "uuid",
  "authorId": "uuid",
  "subjectPlayerId": "uuid",
  "note": "Seems trustworthy, good at challenges",
  "trustLevel": "ally",
  "tags": ["strong", "strategic"],
  "pinned": false
}
```

---

### 3. **Challenge Archive with RNG Verification**
**API**: `/api/challenge/verify`
**Purpose**: Verify commit-reveal fairness for past challenges

**Features**:
- View complete challenge history
- Verify server seed matches commit hash
- Inspect client seeds used for RNG
- Audit trail for fairness

**Example Request**:
```bash
POST /api/challenge/verify
{
  "challengeId": "uuid"
}
```

**Response**:
```json
{
  "ok": true,
  "isValid": true,
  "seedCommit": "sha256_hash",
  "serverSeed": "revealed_seed",
  "clientSeeds": { "playerId": "client_seed" }
}
```

---

### 4. **Jury Question Board**
**Schema**: `juryQuestions` table
**API**: `/api/jury/questions`
**Purpose**: Structured Q&A for Final Tribal Council

**Flow**:
1. Jury members ask finalists questions
2. Finalists answer within timed window
3. All Q&A visible to jury for vote consideration

**Example Request**:
```bash
POST /api/jury/questions
{
  "seasonId": "uuid",
  "jurorId": "uuid",
  "finalistId": "uuid",
  "question": "How did you justify voting out Sarah?"
}
```

**Answer Question**:
```bash
PATCH /api/jury/questions
{
  "id": "question_uuid",
  "answer": "Sarah was a strategic threat..."
}
```

---

### 5. **Achievement Badges**
**API**: `/api/achievements/unlock`
**Purpose**: Cosmetic badges for milestones (no stat bonuses)

**Achievements**:
- 🏆 **Challenge Beast**: Win 3 immunity challenges
- 🦋 **Social Butterfly**: Form 4+ alliances
- 🔥 **Survivor**: Reach Final 3
- 🎥 **Confessional King**: Post 20+ confessionals

**Example Request**:
```bash
POST /api/achievements/unlock
{
  "playerId": "uuid",
  "seasonId": "uuid"
}
```

---

### 6. **Advantage Inspector**
**API**: `/api/advantages/catalog`
**Purpose**: View all advantage types and their rules

**Advantage Types**:
- 💎 **Hidden Immunity Idol**: Nullify votes
- 📜 **Extra Vote**: Cast 2 votes
- 🎯 **Vote Steal**: Steal another's vote
- 🔍 **Knowledge is Power**: Take an advantage from another player

---

### 7. **Season Timeline Visualizer**
**Component**: `app/_components/SeasonTimeline.tsx`
**API**: `/api/season/timeline`
**Purpose**: Interactive phase progression tracker

**Features**:
- Shows past, current, and future episodes
- Phase icons (⛺ Camp, 🏆 Challenge, 🔥 Tribal)
- Live indicator for current phase
- Date ranges for planning

**Usage**:
```tsx
import { SeasonTimeline } from '@/app/_components/SeasonTimeline';

<SeasonTimeline seasonId={seasonId} />
```

---

## 🗄️ Database Schema

### New Tables

**`alliance_notes`**:
```sql
CREATE TABLE alliance_notes (
  id UUID PRIMARY KEY,
  season_id UUID REFERENCES seasons(id),
  author_id UUID REFERENCES players(id),
  subject_player_id UUID REFERENCES players(id),
  note TEXT NOT NULL,
  trust_level TEXT CHECK (trust_level IN ('distrust', 'neutral', 'ally', 'core')),
  tags TEXT[],
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**`jury_questions`**:
```sql
CREATE TABLE jury_questions (
  id UUID PRIMARY KEY,
  season_id UUID REFERENCES seasons(id),
  juror_id UUID REFERENCES players(id),
  finalist_id UUID REFERENCES players(id),
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMP,
  answered_at TIMESTAMP
);
```

---

## 🔒 Security (RLS Policies)

### Alliance Notes
- Authors can CRUD their own notes only
- Notes are private to the author
- No cross-player visibility

### Jury Questions
- Jurors can create questions
- Finalists can read questions addressed to them
- Finalists can update answers to their questions
- All jury members can read all questions/answers

---

## 📦 Migration

Run the SQL migration:
```bash
psql $DATABASE_URL -f sql/2025-11-08_new_features.sql
```

Or apply via Supabase dashboard:
1. Go to SQL Editor
2. Paste contents of `sql/2025-11-08_new_features.sql`
3. Run

---

## 🎨 UI Integration Examples

### Add Stats to Player Profile
```tsx
import { PlayerStatsCard } from '@/app/_components/PlayerStatsCard';

export function PlayerProfile({ player, season }) {
  return (
    <div>
      <h1>{player.displayName}</h1>
      <PlayerStatsCard playerId={player.id} seasonId={season.id} />
    </div>
  );
}
```

### Add Timeline to Season Page
```tsx
import { SeasonTimeline } from '@/app/_components/SeasonTimeline';

export function SeasonOverview({ seasonId }) {
  return (
    <div>
      <h2>Season Schedule</h2>
      <SeasonTimeline seasonId={seasonId} />
    </div>
  );
}
```

---

## ✅ Testing Checklist

- [ ] Run migration on dev database
- [ ] Test player stats aggregation
- [ ] Create/read alliance notes
- [ ] Ask/answer jury questions
- [ ] Verify challenge RNG
- [ ] View advantage catalog
- [ ] Check timeline rendering
- [ ] Verify RLS policies work

---

## 🚀 Deployment Notes

1. **Migration**: Apply SQL migration before deploying code
2. **Environment**: No new env vars needed
3. **Dependencies**: No new packages added
4. **Backwards Compatible**: All features are opt-in

---

## 🎯 Future Enhancements

- **Alliance Graph Visualization**: Network diagram of trust relationships
- **Achievement Notifications**: Push/email when badges unlock
- **Challenge Leaderboard**: Historical rankings across seasons
- **Jury Vote Predictor**: ML model based on Q&A sentiment
- **Timeline Notifications**: Calendar sync for phase transitions

---

## 📝 Notes

- All features follow existing patterns (requireAuth, Zod validation, RLS)
- No breaking changes to core game mechanics
- Stats are read-only aggregations
- Achievements are cosmetic only
- Alliance notes have no gameplay impact
