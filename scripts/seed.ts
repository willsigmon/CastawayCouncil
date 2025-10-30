import { db } from '../drizzle/db';
import {
  users,
  seasons,
  players,
  tribes,
  tribeMembers,
  stats,
  items,
} from '../drizzle/schema';

async function main() {
  console.log('Seeding database...');

  // Create test users
  const testUsers = await db
    .insert(users)
    .values([
      { email: 'player1@test.com', handle: 'player1', avatarUrl: null },
      { email: 'player2@test.com', handle: 'player2', avatarUrl: null },
      { email: 'player3@test.com', handle: 'player3', avatarUrl: null },
      { email: 'player4@test.com', handle: 'player4', avatarUrl: null },
      { email: 'player5@test.com', handle: 'player5', avatarUrl: null },
      { email: 'player6@test.com', handle: 'player6', avatarUrl: null },
      { email: 'player7@test.com', handle: 'player7', avatarUrl: null },
      { email: 'player8@test.com', handle: 'player8', avatarUrl: null },
      { email: 'player9@test.com', handle: 'player9', avatarUrl: null },
      { email: 'player10@test.com', handle: 'player10', avatarUrl: null },
      { email: 'player11@test.com', handle: 'player11', avatarUrl: null },
      { email: 'player12@test.com', handle: 'player12', avatarUrl: null },
      { email: 'player13@test.com', handle: 'player13', avatarUrl: null },
      { email: 'player14@test.com', handle: 'player14', avatarUrl: null },
      { email: 'player15@test.com', handle: 'player15', avatarUrl: null },
      { email: 'player16@test.com', handle: 'player16', avatarUrl: null },
      { email: 'player17@test.com', handle: 'player17', avatarUrl: null },
      { email: 'player18@test.com', handle: 'player18', avatarUrl: null },
    ])
    .returning();

  console.log(`Created ${testUsers.length} test users`);

  // Create a season
  const [season] = await db
    .insert(seasons)
    .values({
      name: 'Season 1: Island of Trials',
      status: 'active',
      startAt: new Date(),
      dayIndex: 1,
    })
    .returning();

  console.log(`Created season: ${season.name}`);

  // Create tribes
  const testTribes = await db
    .insert(tribes)
    .values([
      { seasonId: season.id, name: 'Tidal Wave', color: '#3B82F6' },
      { seasonId: season.id, name: 'Ember Storm', color: '#EF4444' },
      { seasonId: season.id, name: 'Jungle Shade', color: '#10B981' },
    ])
    .returning();

  console.log(`Created ${testTribes.length} tribes`);

  // Create players and assign to tribes
  const testPlayers = await db
    .insert(players)
    .values(
      testUsers.map((user, idx) => ({
        userId: user.id,
        seasonId: season.id,
        displayName: `Player ${idx + 1}`,
        role: 'contestant' as const,
      }))
    )
    .returning();

  console.log(`Created ${testPlayers.length} players`);

  // Assign players to tribes (6 per tribe)
  const tribeMemberships = [];
  for (let i = 0; i < testPlayers.length; i++) {
    const tribeIdx = i % 3;
    tribeMemberships.push({
      tribeId: testTribes[tribeIdx]!.id,
      playerId: testPlayers[i]!.id,
    });
  }

  await db.insert(tribeMembers).values(tribeMemberships);
  console.log(`Assigned players to tribes`);

  // Create initial stats for all players
  const initialStats = testPlayers.map((player) => ({
    playerId: player.id,
    day: 1,
    energy: 100,
    hunger: 100,
    thirst: 100,
    social: 50,
  }));

  await db.insert(stats).values(initialStats);
  console.log(`Created initial stats for all players`);

  // Create hidden immunity idols
  const idols = testTribes.map((tribe) => ({
    seasonId: season.id,
    type: 'idol' as const,
    hiddenLocation: `hidden_near_${tribe.name.toLowerCase().replace(' ', '_')}`,
    charges: 1,
  }));

  await db.insert(items).values(idols);
  console.log(`Created ${idols.length} hidden immunity idols`);

  console.log('Seeding completed successfully!');
}

main().catch((err) => {
  console.error('Seeding failed!');
  console.error(err);
  process.exit(1);
});
