import { Connection, Client } from '@temporalio/client';
import type { SeasonWorkflowInput } from '@/infra/temporal/workflows';

let client: Client | null = null;

/**
 * Get or create Temporal client
 */
export async function getTemporalClient(): Promise<Client> {
  if (!client) {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    client = new Client({
      connection,
      namespace: 'default',
    });
  }

  return client;
}

/**
 * Start a season workflow
 */
export async function startSeasonWorkflow(input: SeasonWorkflowInput): Promise<string> {
  const client = await getTemporalClient();

  const handle = await client.workflow.start('seasonWorkflow', {
    taskQueue: 'castaway-council',
    workflowId: `season-${input.seasonId}`,
    args: [input],
  });

  console.log(`Started season workflow: ${handle.workflowId}`);
  return handle.workflowId;
}

/**
 * Get workflow status
 */
export async function getWorkflowStatus(workflowId: string) {
  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(workflowId);

  try {
    const description = await handle.describe();
    return {
      status: description.status,
      workflowId: description.workflowId,
    };
  } catch (error) {
    console.error('Error getting workflow status:', error);
    return null;
  }
}
