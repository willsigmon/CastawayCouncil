import { db } from '../drizzle/db';
import {
  users,
  seasons,
  players,
  tribes,
  tribeMembers,
  stats,
  advantages,
  inventory,
} from '../drizzle/schema';

// Player class distribution (3 of each class)
const playerClasses = [
  'athlete', 'athlete', 'athlete',
  'strategist', 'strategist', 'strategist',
  'survivalist', 'survivalist', 'survivalist',
  'opportunist', 'opportunist', 'opportunist',
  'diplomat', 'diplomat', 'diplomat',
  'wildcard', 'wildcard', 'wildcard',
] as const;

// Creative player names
const playerNames = [
  'Alex Storm', 'Blake River', 'Casey Wild', 'Drew Frost', 'Eden Ash', 'Finn Blaze',
  'Gray Thorn', 'Haven Moss', 'Ivy Stone', 'Jade Fox', 'Kai Wave', 'Luna Peak',
  'Max Hawk', 'Nova Sage', 'Orion West', 'Phoenix Reed', 'Quinn Bay', 'Raven Sky',
];

async function main() {
  console.log('🌴 Seeding Castaway Council database...\n');

  // Create test users (18 players)
  console.log('Creating 18 test users...');
  const testUsers = await db
    .insert(users)
    .values(
      playerNames.map((name, idx) => ({
        email: `${name.toLowerCase().replace(' ', '.')}@castawaycouncil.game`,
        handle: name.toLowerCase().replace(' ', '_'),
        avatarUrl: null,
      }))
    )
    .returning();

  console.log(`✓ Created ${testUsers.length} test users\n`);

  // Create season (15 days, merge at 12)
  console.log('Creating Season 1...');
  const [season] = await db
    .insert(seasons)
    .values({
      name: 'Season 1: Island of Trials',
      status: 'active',
      startAt: new Date(),
      dayIndex: 1,
      totalDays: 15,
      mergeAt: 12,
    })
    .returning();

  console.log(`✓ Created season: ${season!.name}`);
  console.log(`  - Total days: ${season!.totalDays}`);
  console.log(`  - Merge at: ${season!.mergeAt} players\n`);

  // Create 3 tribes
  console.log('Creating 3 tribes...');
  const testTribes = await db
    .insert(tribes)
    .values([
      { seasonId: season!.id, name: 'Tidal Wave', color: '#3B82F6', disbanded: false },
      { seasonId: season!.id, name: 'Ember Storm', color: '#EF4444', disbanded: false },
      { seasonId: season!.id, name: 'Jungle Shade', color: '#10B981', disbanded: false },
    ])
    .returning();

  console.log(`✓ Created ${testTribes.length} tribes`);
  testTribes.forEach((tribe) => {
    console.log(`  - ${tribe.name} (${tribe.color})`);
  });
  console.log();

  // Shuffle classes for random assignment
  const shuffledClasses = [...playerClasses].sort(() => Math.random() - 0.5);

  // Create players with classes
  console.log('Creating 18 players with classes...');
  const testPlayers = await db
    .insert(players)
    .values(
      testUsers.map((user, idx) => ({
        userId: user.id,
        seasonId: season!.id,
        displayName: playerNames[idx]!,
        playerClass: shuffledClasses[idx]!,
        role: 'contestant' as const,
        wildcardAbility: shuffledClasses[idx] === 'wildcard' ? 'athlete' : undefined, // Initial wildcard ability
      }))
    )
    .returning();

  console.log(`✓ Created ${testPlayers.length} players`);

  // Show class distribution
  const classCounts = testPlayers.reduce((acc, p) => {
    acc[p.playerClass] = (acc[p.playerClass] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n  Class distribution:');
  Object.entries(classCounts).forEach(([cls, count]) => {
    console.log(`  - ${cls}: ${count}`);
  });
  console.log();

  // Assign players to tribes (6 per tribe)
  console.log('Assigning players to tribes...');
  const tribeMemberships = [];
  for (let i = 0; i < testPlayers.length; i++) {
    const tribeIdx = i % 3;
    tribeMemberships.push({
      tribeId: testTribes[tribeIdx]!.id,
      playerId: testPlayers[i]!.id,
    });
  }

  await db.insert(tribeMembers).values(tribeMemberships);
  console.log(`✓ Assigned 6 players to each tribe\n`);

  // Create initial stats for all players (Hunger/Thirst/Comfort/Energy)
  console.log('Creating initial stats for all players...');
  const initialStats = testPlayers.map((player) => ({
    playerId: player.id,
    day: 1,
    hunger: 100,
    thirst: 100,
    comfort: 100,
    energy: 100,
    medicalAlert: false,
  }));

  await db.insert(stats).values(initialStats);
  console.log(`✓ Created initial stats (all at 100)\n`);

  // Create hidden advantages (2 per tribe = 6 total)
  console.log('Creating hidden advantages...');
  const advantageTypes = ['immunity', 'vote_steal', 'extra_vote'];
  const hiddenAdvantages = [];

  for (const tribe of testTribes) {
    // 2 advantages per tribe
    for (let i = 0; i < 2; i++) {
      const advantageType = advantageTypes[Math.floor(Math.random() * advantageTypes.length)]!;
      hiddenAdvantages.push({
        seasonId: season!.id,
        tribeId: tribe.id,
        advantageType,
        hiddenLocation: `Hidden near ${tribe.name} camp (location ${i + 1})`,
        foundByPlayerId: null,
        playedAt: null,
        metadata: null,
      });
    }
  }

  await db.insert(advantages).values(hiddenAdvantages);
  console.log(`✓ Created ${hiddenAdvantages.length} hidden advantages (2 per tribe)\n`);

  // Give each tribe some starting inventory
  console.log('Adding tribe starting inventory...');
  const tribeInventoryItems = [];

  for (const tribe of testTribes) {
    tribeInventoryItems.push(
      {
        seasonId: season!.id,
        inventoryType: 'tribe' as const,
        ownerId: tribe.id,
        itemType: 'tool' as const,
        itemName: 'Basic Spear',
        quantity: 2,
        metadata: { catchRate: 15 },
      },
      {
        seasonId: season!.id,
        inventoryType: 'tribe' as const,
        ownerId: tribe.id,
        itemType: 'material' as const,
        itemName: 'Firewood',
        quantity: 5,
        metadata: null,
      },
      {
        seasonId: season!.id,
        inventoryType: 'tribe' as const,
        ownerId: tribe.id,
        itemType: 'food' as const,
        itemName: 'Coconut',
        quantity: 3,
        metadata: null,
      }
    );
  }

  await db.insert(inventory).values(tribeInventoryItems);
  console.log(`✓ Added starting inventory to each tribe`);
  console.log(`  - 2x Basic Spear (15% catch rate)`);
  console.log(`  - 5x Firewood`);
  console.log(`  - 3x Coconut\n`);

  console.log('🎉 Seeding completed successfully!\n');
  console.log('Summary:');
  console.log(`  - 18 players across 3 tribes`);
  console.log(`  - 6 player classes (3 of each)`);
  console.log(`  - 6 hidden advantages (2 per tribe)`);
  console.log(`  - Starting inventory for each tribe`);
  console.log(`  - Ready for 15-day season!\n`);
}

main().catch((err) => {
  console.error('❌ Seeding failed!');
  console.error(err);
  process.exit(1);
});
