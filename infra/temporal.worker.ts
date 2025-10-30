import { Worker } from '@temporalio/worker';
import * as activities from './temporal/activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./temporal/workflows'),
    activities,
    taskQueue: 'castaway-council',
    namespace: 'default',
  });

  console.log('Temporal worker started...');
  await worker.run();
}

run().catch((err) => {
  console.error('Worker error:', err);
  process.exit(1);
});
