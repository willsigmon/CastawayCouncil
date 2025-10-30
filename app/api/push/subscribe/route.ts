import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { users, pushSubscriptions } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { PushSubscribeRequestSchema } from '@castaway/schemas/src/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, endpoint, keys } = PushSubscribeRequestSchema.parse(body);

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if subscription already exists
    const existingSubscription = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.endpoint, endpoint),
    });

    let subscriptionId: string;

    if (existingSubscription) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: keys.p256dh,
          auth: keys.auth,
        })
        .where(eq(pushSubscriptions.id, existingSubscription.id));
      subscriptionId = existingSubscription.id;
    } else {
      // Create new subscription
      const [newSubscription] = await db
        .insert(pushSubscriptions)
        .values({
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        })
        .returning();
      subscriptionId = newSubscription!.id;
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
    });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
