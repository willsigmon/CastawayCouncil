import webpush from 'web-push';
import { db } from '@/drizzle/db';
import { pushSubscriptions, players } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@castawaycouncil.game';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('⚠️  VAPID keys not configured. Push notifications will not work.');
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  // Get all subscriptions for this user
  const subs = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, userId),
  });

  if (subs.length === 0) {
    console.log(`No push subscriptions found for user ${userId}`);
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      success++;
    } catch (error) {
      console.error(`Failed to send push to subscription ${sub.id}:`, error);
      failed++;

      // If subscription is invalid (410 Gone), delete it
      if ((error as any).statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        console.log(`Deleted invalid subscription ${sub.id}`);
      }
    }
  }

  return { success, failed };
}

/**
 * Send push notification to a player
 */
export async function sendPushToPlayer(
  playerId: string,
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  const player = await db.query.players.findFirst({
    where: eq(players.id, playerId),
    with: { user: true },
  });

  if (!player) {
    console.error(`Player ${playerId} not found`);
    return { success: 0, failed: 0 };
  }

  return sendPushToUser(player.userId, payload);
}

/**
 * Send push notification to multiple players
 */
export async function sendPushToPlayers(
  playerIds: string[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const playerId of playerIds) {
    const result = await sendPushToPlayer(playerId, payload);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  return { success: totalSuccess, failed: totalFailed };
}

/**
 * Send push notification to all players in a season
 */
export async function sendPushToSeason(
  seasonId: string,
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  const seasonPlayers = await db.query.players.findMany({
    where: eq(players.seasonId, seasonId),
  });

  const playerIds = seasonPlayers.map((p) => p.id);

  return sendPushToPlayers(playerIds, payload);
}

/**
 * Common notification templates
 */
export const NotificationTemplates = {
  phaseChange: (phase: string, timeRemaining: string) => ({
    title: `${phase} Phase Started`,
    body: `The ${phase} phase has begun. Time remaining: ${timeRemaining}`,
    tag: 'phase-change',
  }),

  voteReminder: (timeRemaining: string) => ({
    title: 'Vote Reminder',
    body: `Don't forget to vote! ${timeRemaining} remaining`,
    tag: 'vote-reminder',
  }),

  elimination: (playerName: string) => ({
    title: 'Player Eliminated',
    body: `${playerName} has been voted out`,
    tag: 'elimination',
  }),

  merge: (remainingPlayers: number) => ({
    title: 'Tribes Have Merged!',
    body: `The merge is here! ${remainingPlayers} players remain`,
    tag: 'merge',
  }),

  challengeResult: (won: boolean) => ({
    title: won ? 'Challenge Won!' : 'Challenge Lost',
    body: won ? 'Your tribe won immunity!' : 'Your tribe lost the challenge',
    tag: 'challenge-result',
  }),

  newMessage: (from: string, preview: string) => ({
    title: `New message from ${from}`,
    body: preview.slice(0, 100),
    tag: 'new-message',
  }),
};
