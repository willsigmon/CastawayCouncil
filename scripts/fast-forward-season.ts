import { db } from '../drizzle/db';
import { seasons } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { startSeasonWorkflow } from '../app/_server/temporal-client';

/**
 * Fast-forward script to run a season in accelerated time
 * Set FAST_FORWARD_MODE=true in .env
 * 1 minute = 1 hour, so full day = ~22 minutes
 */

async function main() {
  console.log('🚀 Starting fast-forward season...');

  // Get the active season
  const activeSeason = await db.query.seasons.findFirst({
    where: eq(seasons.status, 'active'),
  });

  if (!activeSeason) {
    console.error('No active season found. Run `pnpm db:seed` first.');
    process.exit(1);
  }

  console.log(`Found season: ${activeSeason.name} (${activeSeason.id})`);

  const fastForwardMode = process.env.FAST_FORWARD_MODE === 'true';

  if (!fastForwardMode) {
    console.warn('⚠️  FAST_FORWARD_MODE is not enabled in .env');
    console.warn('This will run a season in real-time (days = real days)');
    console.warn('Set FAST_FORWARD_MODE=true to accelerate');
  }

  // Start the season workflow
  console.log(`Starting season workflow with fastForward=${fastForwardMode}`);

  const workflowId = await startSeasonWorkflow({
    seasonId: activeSeason.id,
    totalDays: 12, // Run for 12 days (should reach final 3)
    fastForwardMode,
  });

  console.log(`✅ Season workflow started: ${workflowId}`);
  console.log(`Monitor at: http://localhost:8080/namespaces/default/workflows/${workflowId}`);

  if (fastForwardMode) {
    console.log('⏱️  Fast-forward mode active:');
    console.log('   - Camp phase: 8 minutes');
    console.log('   - Challenge phase: 8 minutes');
    console.log('   - Vote phase: 6 minutes');
    console.log('   - Total day: ~22 minutes');
    console.log('   - 12 days: ~4.5 hours');
  }
}

main().catch((err) => {
  console.error('Fast-forward failed:', err);
  process.exit(1);
});
